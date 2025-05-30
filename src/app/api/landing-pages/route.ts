import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { performance } from 'node:perf_hooks';
import sanitizeHtml from 'sanitize-html';
import { getLandingPagesByUserId, createLandingPage } from '@/lib/db/models/LandingPage';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Opções de sanitização para HTML
const sanitizeOptions = {
  allowedTags: [
    'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'div', 'span', 'article', 'section', 'header', 'footer', 'nav', 'main',
    'a', 'img', 'picture', 'figure', 'figcaption', 'blockquote', 'cite',
    'pre', 'code', 'em', 'strong', 'b', 'i', 'u', 'small', 'sub', 'sup',
    'form', 'input', 'textarea', 'button', 'select', 'option', 'label',
    'iframe', 'video', 'audio', 'source', 'track',
    'canvas', 'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  ],
  allowedAttributes: {
    '*': ['id', 'class', 'style', 'data-*'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    'video': ['src', 'controls', 'width', 'height', 'autoplay', 'muted', 'loop'],
    'source': ['src', 'type'],
    'input': ['type', 'name', 'value', 'placeholder', 'required', 'checked', 'disabled'],
    'button': ['type', 'name', 'value', 'disabled'],
    'meta': ['name', 'content', 'charset', 'viewport'],
    'link': ['rel', 'href', 'type'],
    'script': ['src', 'type', 'async', 'defer'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

// Função para chamar a API de IA com tratamento de erro e retentativas
async function callAIAPI(prompt: string) {
  const startTime = performance.now();
  const maxRetries = 2;
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Loop de retentativas
  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      // 180 segundos de timeout para cada tentativa
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      console.log(`Tentativa ${retryCount + 1} de chamar a API de IA`);
      
      // Determinar qual API usar com base na configuração
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
      const apiEndpoint = process.env.DEEPSEEK_API_KEY 
        ? 'https://api.deepseek.com/v1/chat/completions' 
        : 'https://api.openai.com/v1/chat/completions';
      const apiModel = process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o';
      
      if (!apiKey) {
        throw new Error('Chave de API não configurada');
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em design de landing pages, HTML, CSS e copywriting de alta conversão. Seu objetivo é criar landing pages completas e profissionais com código moderno e responsivo. Seja conciso e eficiente na geração, focando em código limpo e otimizado.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5, // Reduzindo para respostas mais consistentes
          max_tokens: 4000, // Ajustando para respostas mais completas
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API: ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      console.log(`landingpage_api_call: ${(endTime - startTime).toFixed(3)}ms`);
      
      let content = data.choices[0].message.content;
      
      // Remover quaisquer tags de markdown (```html e ```) se existirem
      content = content.replace(/^```html\s*/i, '');
      content = content.replace(/^```(html|)\s*/i, '');
      content = content.replace(/\s*```\s*$/i, '');
      
      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Erro na tentativa ${retryCount + 1}:`, lastError);
      
      // Se for um erro de abort, não tente novamente
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Requisição abortada por timeout');
        throw new Error('Tempo limite excedido na API');
      }
      
      // Verificar se deve tentar novamente
      if (retryCount < maxRetries) {
        // Esperar com backoff exponencial (1s, 2s, 4s...)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retryCount++;
      } else {
        // Esgotou as tentativas
        throw new Error(`Falha após ${maxRetries + 1} tentativas: ${lastError?.message}`);
      }
    }
  }
  
  // Nunca deve chegar aqui, mas o TypeScript requer um retorno
  throw new Error('Erro inesperado no loop de retentativas');
}

// Função para salvar imagem de uma URL base64 e retornar o caminho
async function saveBase64Image(base64String: string): Promise<string> {
  try {
    // Extrair dados da string base64
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Formato de base64 inválido');
    }
    
    const [, mimeType, base64Data] = matches;
    const extension = mimeType.split('/')[1] || 'png';
    
    // Criar pasta de uploads se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Gerar nome de arquivo único
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Converter base64 para buffer e salvar arquivo
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);
    
    // Retornar URL relativa da imagem
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    throw error;
  }
}

// GET - Listar todas as landing pages do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Buscar todas as landing pages do usuário
    const landingPages = await getLandingPagesByUserId(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: landingPages
    });
    
  } catch (error) {
    console.error('Erro ao listar landing pages:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao listar landing pages: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// POST - Gerar e criar uma nova landing page
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Verificar se é uma requisição para geração de landing page ou criação direta
    const contentType = request.headers.get('Content-Type') || '';
    const isGenerationRequest = contentType.includes('application/json');
    
    // Se for requisição para geração com IA
    if (isGenerationRequest) {
      const { 
        niche, 
        product, 
        benefits = [],
        targetAudience,
        callToAction,
        testimonials = false,
        pricing = '',
        style = 'minimalista',
        images = []
      } = await request.json();

      // Validar os parâmetros necessários
      if (!niche || !product) {
        return NextResponse.json(
          { success: false, message: 'Os parâmetros "niche" e "product" são obrigatórios' },
          { status: 400 }
        );
      }

      // Processar imagens base64 e salvar no servidor
      const processedImages = [];
      if (images && images.length > 0) {
        for (const imageData of images) {
          try {
            const imagePath = await saveBase64Image(imageData);
            processedImages.push(imagePath);
          } catch (error) {
            console.error('Erro ao processar imagem:', error);
            // Continuar mesmo com erro em uma das imagens
          }
        }
      }

      // Construir instruções sobre as imagens
      let imageInstructions = '';
      if (processedImages.length > 0) {
        imageInstructions = `
        INSTRUÇÕES IMPORTANTES PARA IMAGENS:
        
        O usuário forneceu as seguintes imagens que já foram salvas no servidor:
        ${processedImages.map((path, index) => `- Imagem ${index + 1}: ${path}`).join('\n')}
        
        Você deve incorporar essas imagens na landing page, incluindo as tags img com os caminhos exatos.
        Exemplo: <img src="${processedImages[0]}" alt="Imagem do produto" class="img-fluid">
        
        Coloque cada imagem em um local estratégico (hero section, seção de benefícios, galeria, etc.).
        `;
      } else {
        imageInstructions = `
        Como não foram fornecidas imagens pelo usuário, use URLs de imagens de placeholder:
        - https://placehold.co/600x400/png
        - https://via.placeholder.com/800x600
        `;
      }

      // Construir o prompt para o modelo
      const prompt = `
      Crie uma landing page de alta conversão sobre:
      
      - Nicho: ${niche}
      - Produto: ${product}
      - Público-alvo: ${targetAudience || 'Pessoas interessadas no nicho'}
      - CTA: ${callToAction || 'Comprar agora'}
      - Estilo: ${style}
      
      Benefícios:
      ${benefits.length > 0 
        ? benefits.map((benefit: string) => `- ${benefit}`).join('\n') 
        : '- Defina 3 benefícios principais baseados no nicho e produto'}
      
      ${pricing ? `Preço: ${pricing}` : ''}
      ${testimonials ? 'Inclua seção para depoimentos' : ''}
      
      ${imageInstructions}
      
      INSTRUÇÕES TÉCNICAS:
      1. HTML completo, semântico e responsivo
      2. CSS embutido no <style> do head
      3. Se necessário, JavaScript no <script> ao final
      4. Design responsivo e otimizado para conversão
      5. Use Font Awesome para ícones
      6. NÃO use tags markdown como \`\`\`html ou \`\`\` no início ou fim do código
      7. Responda APENAS com o código HTML completo, nada mais.
      8. Mantenha o código limpo e bem estruturado
      `;

      // Realizar a chamada para a API de IA
      let result = await callAIAPI(prompt);

      // Sanitizar o HTML para segurança
      const sanitizedHtml = sanitizeHtml(result, sanitizeOptions);
      
      // Criar a landing page no banco de dados
      const landingPage = await createLandingPage({
        title: `${product} - ${niche}`,
        description: `Landing page para ${product} no nicho de ${niche}`,
        html: sanitizedHtml,
        tags: [niche, style],
        userId: session.user.id
      } as any);
      
      const endTime = performance.now();
      console.log(`Total landing page generation time: ${(endTime - startTime).toFixed(3)}ms`);
      
      return NextResponse.json({
        success: true,
        data: landingPage
      });
    } 
    // Se for criação direta via formulário multipart
    else {
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const description = formData.get('description') as string || '';
      const html = formData.get('html') as string;
      const tagsString = formData.get('tags') as string || '';
      const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
      
      // Validar campos obrigatórios
      if (!title || !html) {
        return NextResponse.json({
          success: false,
          message: 'Título e HTML são obrigatórios'
        }, { status: 400 });
      }
      
      // Sanitizar o HTML para segurança
      const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
      
      // Criar a landing page no banco de dados
      const landingPage = await createLandingPage({
        title,
        description,
        html: sanitizedHtml,
        tags,
        userId: session.user.id
      } as any);
      
      return NextResponse.json({
        success: true,
        data: landingPage
      });
    }
    
  } catch (error) {
    console.error('Erro ao criar landing page:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao criar landing page: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 