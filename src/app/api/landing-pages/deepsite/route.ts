import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { consumeDeepSiteCredits, hasEnoughCredits } from '@/lib/deepsite-credits';
import { Performance } from '@/lib/performance';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { MemoryCache } from '@/lib/memory-cache';
import { 
  sanitizeOptions, 
  processLandingPageHtml, 
  sanitizeLandingPageHtml,
  addSeoMetaTags,
  addTrackingToLandingPage 
} from './utils';

// Armazenamento global de sessões
declare global {
  var deepsiteSessions: Record<string, {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    html: string;
    title: string;
    originalLength: number;
    sanitizedLength: number;
  }>;
}

// Inicializar o objeto global de sessões
if (!global.deepsiteSessions) {
  global.deepsiteSessions = {};
}

// Cache para armazenar as sessões
const sessionsCache = new MemoryCache<{
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  html: string;
  title: string;
  originalLength: number;
  sanitizedLength: number;
}>();

// Esquema de validação para o corpo da requisição
const landingPageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  tone: z.string().min(1, "Tom é obrigatório"),
  callToAction: z.string().min(1, "Call-to-Action é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  includeComponents: z.array(z.string()),
  additionalInfo: z.string().optional(),
  model: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  seoConfig: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.string().optional(),
    ogImage: z.string().optional(),
    ogUrl: z.string().optional(),
    ogType: z.string().optional()
  }).optional(),
  trackingConfig: z.object({
    googleAnalyticsId: z.string().optional(),
    facebookPixelId: z.string().optional(),
    gtmId: z.string().optional()
  }).optional()
});

// DeepSeek API Client
class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private maxRetries: number;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.deepseek.com";
    this.defaultModel = "deepseek-coder";
    this.maxRetries = 3;
  }

  async chatCompletion({ model, messages, max_tokens, temperature, retryCount = 0 }: {
    model: string;
    messages: Array<{role: string, content: string}>;
    max_tokens?: number;
    temperature?: number;
    retryCount?: number;
  }): Promise<any> {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Timeout para evitar requisições penduradas
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 segundos

    console.log(`[DeepSeek API] Enviando requisição para modelo: ${model}`);
    console.log(`[DeepSeek API] Parâmetros: max_tokens=${max_tokens}, temperature=${temperature}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          max_tokens: max_tokens || 8192,
          temperature: temperature || 0.7
        }),
        signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error(`[DeepSeek API] Erro ${response.status}:`, errorData);
        
        // Retry em caso de erros específicos
        if ((response.status === 429 || response.status >= 500) && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
          console.log(`[DeepSeek API] Aguardando ${delay}ms antes de tentar novamente (tentativa ${retryCount + 1}/${this.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.chatCompletion({
            model,
            messages,
            max_tokens,
            temperature,
            retryCount: retryCount + 1
          });
        }
        
        throw new Error(`Erro na API DeepSeek: ${response.status} ${errorData.error || errorData.message || 'Erro desconhecido'}`);
      }
      
      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Requisição cancelada por timeout');
      }
      
      // Retry em caso de erros de rede
      if (retryCount < this.maxRetries && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('connection')
      )) {
        const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
        console.log(`[DeepSeek API] Erro de rede, aguardando ${delay}ms antes de tentar novamente`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.chatCompletion({
          model,
          messages,
          max_tokens,
          temperature,
          retryCount: retryCount + 1
        });
      }
      
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  const performance = new Performance();
  performance.startTimer('generateLandingPage');
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar saldo de créditos
    if (!(await hasEnoughCredits(session.user.id))) {
      return NextResponse.json({ error: 'Saldo de créditos insuficiente' }, { status: 402 });
    }
    
    // Validar os dados de entrada
    const requestData = await request.json();
    
    try {
      landingPageSchema.parse(requestData);
    } catch (error: any) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    
    const {
      title,
      description,
      tone,
      callToAction,
      color,
      includeComponents,
      additionalInfo = '',
      model = 'deepseek-coder',
      imageUrls = [],
      seoConfig = {},
      trackingConfig = {}
    } = requestData;
    
    // Criar cliente DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API DeepSeek não configurada' }, { status: 500 });
    }
    
    const client = new DeepSeekClient(apiKey);
    
    // Construir prompt para a DeepSeek
    const prompt = `Você é um especialista em desenvolvimento de landing pages modernas e conversoras. 
    Crie uma landing page completa em HTML para o seguinte:
    
    Título: ${title}
    Descrição: ${description}
    Tom: ${tone}
    Call-to-Action: ${callToAction}
    Cor principal: ${color}
    Componentes a incluir: ${includeComponents.join(", ")}
    
    Informações adicionais: ${additionalInfo}
    
    Requisitos:
    1. Use HTML5 semântico e moderno.
    2. Utilize CSS moderno e responsivo (inclua diretamente no <head> em uma tag <style>).
    3. Otimize para mobile e desktop com design responsivo.
    4. Crie um design visualmente atraente seguindo princípios de UX.
    5. Use apenas ícones SVG inline (não use bibliotecas externas como Font Awesome).
    6. Use Bootstrap 5 e FontAwesome para ícones. Utilize os CDNs apropriados.
    7. Use fontes como Montserrat, Roboto, ou Open Sans via Google Fonts.
    8. Para imagens, use placeholders com formato: __IMG_1__, __IMG_2__, etc. que serão substituídos posteriormente.
    9. Adicione animações usando a biblioteca AOS (Animate On Scroll).
    10. Para compatibilidade com todos os navegadores, use recursos CSS/JS amplamente suportados.
    11. Adicione efeitos sutis de hover e animações para melhorar a experiência do usuário.
    12. Implemente estrutura semântica com header, main, section, footer, etc.
    13. Inclua microdados estruturados (schema.org) para SEO.
    14. Use elementos de design modernos: gradientes, sombras suaves, efeitos de profundidade.
    15. Adicione atributos data-aos para elementos que devem ter animações ao scroll.

    Retorne apenas o código HTML completo, começando com <!DOCTYPE html>.`;
    
    // Enviar requisição para a DeepSeek
    console.log(`Gerando landing page com DeepSeek para: ${title}`);
    const startTime = Date.now();
    
    try {
      const response = await client.chatCompletion({
        model,
        messages: [
          { role: "system", content: "Você é um assistente especializado em desenvolvimento de landing pages HTML/CSS modernas. Responda apenas com código HTML completo, sem explicações." },
          { role: "user", content: prompt }
        ],
        max_tokens: 8192,
        temperature: 0.7
      });
      
      const endTime = Date.now();
      
      // Consumir crédito
      await consumeDeepSiteCredits(session.user.id);
      
      // Extrair HTML da resposta
      const cleanedHtml = response.choices[0].message.content.trim();
      
      // Aplicar o processamento avançado
      const sanitizedHtml = await sanitizeLandingPageHtml(cleanedHtml);
      
      // Processar imagens e outros elementos
      let processedHtml = await processLandingPageHtml(sanitizedHtml, imageUrls);
      
      // Adicionar meta tags de SEO se fornecidas
      if (seoConfig && Object.keys(seoConfig).length > 0) {
        processedHtml = await addSeoMetaTags(processedHtml, seoConfig);
      }
      
      // Adicionar scripts de tracking se fornecidos
      if (trackingConfig && Object.keys(trackingConfig).length > 0) {
        processedHtml = await addTrackingToLandingPage(processedHtml, trackingConfig);
      }
      
      // Criar ID para a sessão
      const sessionId = uuidv4();
      
      // Armazenar na cache
      sessionsCache.set(sessionId, {
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        html: processedHtml,
        title,
        originalLength: cleanedHtml.length,
        sanitizedLength: processedHtml.length
      });
      
      // Armazenar também no objeto global para persistência
      global.deepsiteSessions[sessionId] = {
        id: sessionId,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        html: processedHtml,
        title,
        originalLength: cleanedHtml.length,
        sanitizedLength: processedHtml.length
      };
      
      return NextResponse.json({
        sessionId,
        title,
        html: processedHtml,
        stats: {
          originalLength: cleanedHtml.length,
          sanitizedLength: processedHtml.length,
          processingTime: (endTime - startTime).toFixed(2)
        }
      });
    } catch (error: any) {
      console.error('Erro ao gerar landing page:', error);
      return NextResponse.json({ 
        error: 'Erro ao gerar landing page', 
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro não tratado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  } finally {
    performance.endTimer('generateLandingPage');
  }
}

// Endpoint para obter uma sessão pelo ID
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json({ 
        ok: false, 
        message: "ID de sessão não fornecido" 
      }, { status: 400 });
    }
    
    const deepSiteSession = sessionsCache.get(sessionId) || global.deepsiteSessions[sessionId];
    
    if (!deepSiteSession) {
      return NextResponse.json({ 
        ok: false, 
        message: "Sessão não encontrada ou expirada" 
      }, { status: 404 });
    }
    
    // Verificar se o usuário é o proprietário da sessão
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({ 
        ok: false, 
        message: "Acesso negado a esta sessão" 
      }, { status: 403 });
    }
    
    return NextResponse.json({
      ok: true,
      session: deepSiteSession
    });
    
  } catch (error: any) {
    console.error("Erro ao obter sessão:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao obter sessão: ${error.message}`
    }, { status: 500 });
  }
} 