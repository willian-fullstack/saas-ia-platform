import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Performance } from '@/lib/performance';
import { consumeDeepSiteCredits, hasEnoughCredits } from '@/lib/deepsite-credits';
import { z } from 'zod';
import { createGzip, createGunzip } from "zlib";
import { createClient } from "@/lib/deepseek";
import sanitizeHtml from "sanitize-html";
import { getUserFromServerSession } from "@/lib/auth";
import { DeepSiteCredits } from "@/lib/deepsite-credits";
import { Readable } from 'stream';

// Opções para sanitização de HTML
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'style'],
    'svg': ['viewBox', 'width', 'height', 'xmlns', 'fill', 'stroke'],
    'path': ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    'circle': ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
    'rect': ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'rx', 'ry'],
    'g': ['transform', 'fill', 'stroke'],
    'a': ['href', 'target', 'rel']
  },
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background-color': [/.*/],
      'text-align': [/.*/],
      'margin': [/.*/],
      'padding': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'font-family': [/.*/],
      'text-decoration': [/.*/],
      'display': [/.*/],
      'width': [/.*/],
      'height': [/.*/],
      'border': [/.*/],
      'border-radius': [/.*/],
      'box-shadow': [/.*/],
      'transition': [/.*/],
      'transform': [/.*/],
      'opacity': [/.*/]
    }
  }
};

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

  async chatCompletionStream({ model, messages, max_tokens, temperature, retryCount = 0 }: {
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

    console.log(`[DeepSeek API Stream] Enviando requisição para modelo: ${model}`);
    console.log(`[DeepSeek API Stream] Parâmetros: max_tokens=${max_tokens}, temperature=${temperature}`);
    
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
          temperature: temperature || 0.7,
          stream: true
        }),
        signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error(`[DeepSeek API Stream] Erro ${response.status}:`, errorData);
        
        // Retry em caso de erros específicos
        if ((response.status === 429 || response.status >= 500) && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
          console.log(`[DeepSeek API Stream] Aguardando ${delay}ms antes de tentar novamente (tentativa ${retryCount + 1}/${this.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.chatCompletionStream({
            model,
            messages,
            max_tokens,
            temperature,
            retryCount: retryCount + 1
          });
        }
        
        throw new Error(`Erro na API DeepSeek: ${response.status} ${errorData.error || errorData.message || 'Erro desconhecido'}`);
      }
      
      return response;
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
        console.log(`[DeepSeek API Stream] Erro de rede, aguardando ${delay}ms antes de tentar novamente`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.chatCompletionStream({
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

// Esquema de validação para o corpo da requisição
const askAiSchema = z.object({
  sessionId: z.string().min(1, "ID da sessão é obrigatório"),
  html: z.string().min(1, "HTML é obrigatório"),
  prompt: z.string().min(10, "Prompt é obrigatório e deve ter pelo menos 10 caracteres"),
  model: z.string().optional()
});

/**
 * Remove dependências externas do HTML e as substitui por alternativas inline.
 * @param {string} html - O HTML a ser processado.
 * @returns {string} - HTML sem dependências externas.
 */
function removeDependencias(html: string): string {
  // Remover links para CSS externos (Bootstrap, Font Awesome, etc.)
  let processedHtml = html.replace(/<link[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi, '');
  
  // Remover scripts externos
  processedHtml = processedHtml.replace(/<script[^>]*src=["']https?:\/\/[^"']*["'][^>]*><\/script>/gi, '');
  
  // Substituir ícones do Font Awesome por SVGs básicos
  // Se tivermos class="fa fa-star" ou similares, substituir por SVG inline
  processedHtml = processedHtml.replace(/<i[^>]*class=["'][^"']*fa[^"']*fa-([a-z-]+)[^"']*["'][^>]*><\/i>/gi, (match, iconName) => {
    // Retornar SVG básico correspondente ou um placeholder
    const svgMap: Record<string, string> = {
      'star': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      'check': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      'user': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
      'arrow-right': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
      // Adicionar mais ícones conforme necessário
    };
    
    return svgMap[iconName] || '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect width="24" height="24" fill="none" stroke="currentColor"/></svg>';
  });
  
  // Adicionar CSS mínimo do Bootstrap se a página usar classes Bootstrap
  if (processedHtml.includes('class="container"') || 
      processedHtml.includes('class="row"') || 
      processedHtml.includes('class="col-')) {
    
    const bootstrapCSS = `
    <style>
      /* Grid simplificado */
      .container { width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto; }
      @media (min-width: 576px) { .container { max-width: 540px; } }
      @media (min-width: 768px) { .container { max-width: 720px; } }
      @media (min-width: 992px) { .container { max-width: 960px; } }
      @media (min-width: 1200px) { .container { max-width: 1140px; } }
      .row { display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px; }
      [class*="col-"] { position: relative; width: 100%; padding-right: 15px; padding-left: 15px; }
      
      /* Colunas simplificadas */
      .col { flex-basis: 0; flex-grow: 1; max-width: 100%; }
      .col-md-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
      .col-md-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
      .col-md-3 { flex: 0 0 25%; max-width: 25%; }
      .col-md-4 { flex: 0 0 33.333333%; max-width: 33.333333%; }
      .col-md-6 { flex: 0 0 50%; max-width: 50%; }
      .col-md-8 { flex: 0 0 66.666667%; max-width: 66.666667%; }
      .col-md-12 { flex: 0 0 100%; max-width: 100%; }
      
      /* Utilitários comuns */
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .d-flex { display: flex; }
      .justify-content-center { justify-content: center; }
      .align-items-center { align-items: center; }
      .rounded { border-radius: 0.25rem; }
      .img-fluid { max-width: 100%; height: auto; }
      .btn { display: inline-block; padding: 0.375rem 0.75rem; border: 1px solid transparent; border-radius: 0.25rem; cursor: pointer; text-align: center; }
      .btn-primary { background-color: #007bff; color: white; }
      .btn-primary:hover { background-color: #0069d9; }
      .mt-3 { margin-top: 1rem; }
      .mb-3 { margin-bottom: 1rem; }
      .py-3 { padding-top: 1rem; padding-bottom: 1rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      
      /* Responsividade simplificada */
      @media (max-width: 767.98px) {
        [class*="col-md"] { flex: 0 0 100%; max-width: 100%; }
      }
    </style>
    `;
    
    // Inserir CSS do Bootstrap no head
    processedHtml = processedHtml.replace('</head>', `${bootstrapCSS}</head>`);
  }
  
  // Adicionar CSS mínimo do AOS se a página usar data-aos
  if (processedHtml.includes('data-aos')) {
    const aosCSS = `
    <style>
      [data-aos] { opacity: 0; transition: opacity 0.3s, transform 0.3s; }
      [data-aos].aos-animate { opacity: 1; transform: translate(0, 0); }
      [data-aos="fade-up"] { transform: translateY(20px); }
      [data-aos="fade-down"] { transform: translateY(-20px); }
      [data-aos="fade-right"] { transform: translateX(-20px); }
      [data-aos="fade-left"] { transform: translateX(20px); }
    </style>
    `;
    
    const aosJS = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const aosElements = document.querySelectorAll('[data-aos]');
        
        // Função para verificar se elemento está visível
        function isElementInViewport(el) {
          const rect = el.getBoundingClientRect();
          return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
          );
        }
        
        // Verificar inicialmente
        aosElements.forEach(element => {
          if (isElementInViewport(element)) {
            element.classList.add('aos-animate');
          }
        });
        
        // Verificar no scroll
        window.addEventListener('scroll', function() {
          aosElements.forEach(element => {
            if (isElementInViewport(element)) {
              element.classList.add('aos-animate');
            }
          });
        });
      });
    </script>
    `;
    
    // Inserir CSS e JS do AOS
    processedHtml = processedHtml.replace('</head>', `${aosCSS}</head>`);
    processedHtml = processedHtml.replace('</body>', `${aosJS}</body>`);
  }
  
  return processedHtml;
}

// Processamento da resposta para o stream
function processStreamPart(part: string): string {
  // Limpar o conteúdo recebido
  const sanitized = sanitizeHtml(part, sanitizeOptions);
  // Remover dependências externas
  return removeDependencias(sanitized);
}

export async function POST(request: NextRequest) {
  const startTime = Performance.now();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    // Validar dados de entrada
    const body = await request.json();
    const validationResult = askAiSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        ok: false, 
        message: "Dados inválidos", 
        errors: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { sessionId, html, prompt, model = "deepseek-coder" } = validationResult.data;
    
    // Verificar se a sessão existe
    const deepSiteSession = global.deepsiteSessions?.[sessionId];
    
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
    
    // Verificar disponibilidade de créditos
    const hasCredits = await hasEnoughCredits("IMPROVE_LANDING_PAGE");
    
    if (!hasCredits) {
      return NextResponse.json({ 
        ok: false, 
        message: "Créditos insuficientes para esta operação" 
      }, { status: 403 });
    }
    
    // Construir prompt para a DeepSeek
    const systemPrompt = `
Você é um especialista em desenvolvimento web e design de landing pages. 
Sua tarefa é melhorar uma landing page HTML existente com base nas instruções do usuário.

REGRAS IMPORTANTES - ABSOLUTAMENTE OBRIGATÓRIAS:
1. PROIBIDO ADICIONAR BIBLIOTECAS EXTERNAS OU CDNs como Bootstrap, jQuery, Font Awesome, AOS, etc.
2. PROIBIDO incluir tags <link> para recursos externos como fontes, CSS ou outros arquivos.
3. PROIBIDO incluir tags <script> com atributo src apontando para qualquer recurso externo.
4. Todo o CSS deve estar embutido na página em tags <style> no <head>.
5. Todo o JavaScript necessário deve estar embutido na página em tags <script>.
6. Use apenas elementos <svg> inline para ícones e gráficos.
7. Certifique-se de que o HTML resultante seja 100% autossuficiente sem dependências externas.
8. Não adicione referencias a bibliotecas externas como TailwindCSS, Bootstrap, etc., mesmo que "inline".

Para fazer alterações específicas no código HTML, use o seguinte formato:

<<<<<<< SEARCH
[código original que deve ser substituído]
=======
[novo código que substituirá o original]
>>>>>>> REPLACE

Você pode incluir vários blocos SEARCH/REPLACE em sua resposta.
Certifique-se de que o código original no bloco SEARCH exista exatamente no HTML fornecido.
Seja preciso nas substituições para garantir que o HTML continue válido.

Responda APENAS com os blocos SEARCH/REPLACE necessários, sem explicações adicionais.
`;
    
    // Inicializar DeepSeek Client
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
      return NextResponse.json({ 
        ok: false, 
        message: "Configuração da API DeepSeek ausente" 
      }, { status: 500 });
    }
    
    const client = new DeepSeekClient(deepseekApiKey);
    
    // Preparar mensagens para a API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `HTML atual da página:\n\n${html}\n\nInstruções para melhoria:\n${prompt}` }
    ];
    
    // Iniciar streaming da resposta
    const response = await client.chatCompletionStream({
      model,
      messages,
      max_tokens: 8192,
      temperature: 0.7
    });
    
    // Criar um ReadableStream para processar a resposta
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let buffer = '';
        
        try {
          // Consumir créditos no início do streaming
          await consumeDeepSiteCredits(
            "IMPROVE_LANDING_PAGE", 
            `Melhoria da landing page "${deepSiteSession.title}"`
          );
          
          // Processar cada chunk de dados
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Processar qualquer buffer restante
              if (buffer.trim()) {
                try {
                  const lines = buffer.split('\n');
                  for (const line of lines) {
                    if (line.trim().startsWith('data:')) {
                      const data = line.replace(/^data: /, '').trim();
                      if (data !== '[DONE]') {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content || '';
                        if (content) {
                          controller.enqueue(new TextEncoder().encode(content));
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error('Erro ao processar buffer final:', e);
                }
              }
              
              break;
            }
            
            // Decodificar o chunk e adicionar ao buffer
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            
            // Processar linhas completas do buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Último item pode ser incompleto
            
            for (const line of lines) {
              if (line.trim().startsWith('data:')) {
                const data = line.replace(/^data: /, '').trim();
                if (data === '[DONE]') continue;
                
                try {
                  const json = JSON.parse(data);
                  const content = json.choices[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  console.error('Erro ao processar linha:', e, 'Linha:', line);
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Erro durante streaming:', error);
          controller.error(error);
        }
      }
    });
    
    // Registrar métricas de desempenho
    const setupTime = Performance.now() - startTime;
    Performance.record('ask_ai_setup', setupTime);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error("Erro ao processar solicitação ask-ai:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao processar solicitação: ${error.message}`
    }, { status: 500 });
  }
} 