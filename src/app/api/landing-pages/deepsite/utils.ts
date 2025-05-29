/**
 * Utilitários gerais para o DeepSite
 * 
 * Este módulo fornece funções e configurações utilitárias para o sistema DeepSite.
 */

import { v4 as uuidv4 } from 'uuid';
import sanitizeHtml from 'sanitize-html';
import OpenAI from 'openai';

// Inicializar a instância do OpenAI com tratamento de erro
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('Cliente OpenAI inicializado com sucesso');
  } else {
    console.warn('OPENAI_API_KEY não encontrada no ambiente. Funcionalidades de IA estarão limitadas.');
  }
} catch (error) {
  console.error('Erro ao inicializar cliente OpenAI:', error);
}

/**
 * Opções de sanitização para HTML
 */
export const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'div', 'span', 'a', 'img', 'picture', 'source',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'form', 'input', 'textarea', 'button', 'select', 'option', 'label',
    'section', 'article', 'header', 'footer', 'nav', 'aside', 'main',
    'figure', 'figcaption', 'blockquote', 'cite', 'code', 'pre',
    'iframe', 'video', 'audio', 'source', 'track',
    'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'
  ],
  allowedAttributes: {
    '*': ['id', 'class', 'style', 'data-*'],
    'a': ['href', 'target', 'rel', 'download'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    'video': ['src', 'controls', 'width', 'height', 'poster'],
    'audio': ['src', 'controls'],
    'source': ['src', 'type'],
    'input': ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'checked'],
    'textarea': ['name', 'placeholder', 'rows', 'cols', 'required', 'disabled'],
    'button': ['type', 'name', 'value', 'disabled'],
    'select': ['name', 'required', 'disabled'],
    'option': ['value', 'selected', 'disabled'],
    'form': ['action', 'method', 'enctype', 'target'],
    'meta': ['name', 'content', 'charset', 'http-equiv'],
    'link': ['rel', 'href', 'type'],
    'svg': ['viewBox', 'width', 'height', 'xmlns']
  },
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background': [/.*/],
      'background-color': [/.*/],
      'background-image': [/.*/],
      'background-position': [/.*/],
      'background-size': [/.*/],
      'background-repeat': [/.*/],
      'text-align': [/.*/],
      'text-decoration': [/.*/],
      'font-size': [/.*/],
      'font-family': [/.*/],
      'font-weight': [/.*/],
      'width': [/.*/],
      'height': [/.*/],
      'max-width': [/.*/],
      'max-height': [/.*/],
      'min-width': [/.*/],
      'min-height': [/.*/],
      'margin': [/.*/],
      'margin-top': [/.*/],
      'margin-right': [/.*/],
      'margin-bottom': [/.*/],
      'margin-left': [/.*/],
      'padding': [/.*/],
      'padding-top': [/.*/],
      'padding-right': [/.*/],
      'padding-bottom': [/.*/],
      'padding-left': [/.*/],
      'border': [/.*/],
      'border-radius': [/.*/],
      'display': [/.*/],
      'flex': [/.*/],
      'flex-direction': [/.*/],
      'justify-content': [/.*/],
      'align-items': [/.*/],
      'position': [/.*/],
      'top': [/.*/],
      'right': [/.*/],
      'bottom': [/.*/],
      'left': [/.*/],
      'z-index': [/.*/],
      'box-shadow': [/.*/],
      'transform': [/.*/],
      'transition': [/.*/]
    }
  },
  allowedSchemes: ['http', 'https', 'data', 'mailto', 'tel'],
  allowProtocolRelative: true
};

/**
 * Interface para sessão do DeepSite
 */
interface DeepSiteSession {
  id: string;
  userId: string;
  html: string;
  title: string;
  messages?: any[]; // Adicionado para armazenar mensagens
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inicializa o armazenamento global de sessões
 */
export function initSessionStorage(): void {
  if (typeof global.deepsiteSessions === 'undefined') {
    global.deepsiteSessions = {};
  }
}

/**
 * Cria uma nova sessão do DeepSite
 * 
 * @param userId - ID do usuário dono da sessão
 * @param html - HTML inicial da landing page
 * @param title - Título da landing page
 * @returns ID da sessão criada
 */
export function createSession(userId: string, html: string, title: string): string {
  initSessionStorage();
  
  const sessionId = uuidv4();
  const now = new Date();
  
  global.deepsiteSessions[sessionId] = {
    id: sessionId,
    userId,
    html,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
  
  // Configurar limpeza automática após 24 horas
  setTimeout(() => {
    if (global.deepsiteSessions && global.deepsiteSessions[sessionId]) {
      delete global.deepsiteSessions[sessionId];
    }
  }, 24 * 60 * 60 * 1000); // 24 horas
  
  return sessionId;
}

/**
 * Verifica se uma sessão existe e pertence ao usuário
 * 
 * @param {string} sessionId - ID da sessão
 * @param {string} userId - ID do usuário
 * @returns true se a sessão for válida e pertencer ao usuário
 */
export function isValidSession(sessionId: string, userId: string): boolean {
  if (!global.deepsiteSessions || !global.deepsiteSessions[sessionId]) {
    return false;
  }
  
  // Permitir acesso a sessões anônimas
  if (global.deepsiteSessions[sessionId].userId === 'anonymous-user') {
    return true;
  }
  
  return global.deepsiteSessions[sessionId].userId === userId;
}

/**
 * Limpa sessões expiradas (mais de 24 horas)
 */
export function cleanExpiredSessions(): void {
  if (!global.deepsiteSessions) return;
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  Object.keys(global.deepsiteSessions).forEach((sessionId: string) => {
    const session = global.deepsiteSessions[sessionId];
    if (session.updatedAt < oneDayAgo) {
      delete global.deepsiteSessions[sessionId];
    }
  });
}

/**
 * Processa o prompt com a IA e retorna um stream de resposta
 * 
 * @param prompt - O prompt a ser enviado para a IA
 * @param sessionId - ID da sessão do DeepSite
 * @returns Stream de resposta da IA
 */
export async function streamAIResponse(prompt: string, sessionId: string): Promise<ReadableStream> {
  if (!global.deepsiteSessions) {
    global.deepsiteSessions = {};
  }

  if (!global.deepsiteSessions[sessionId]) {
    global.deepsiteSessions[sessionId] = {
      id: sessionId,
      userId: 'anonymous-user',
      html: '',
      title: 'Nova Landing Page',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Instruções específicas para gerar uma landing page responsiva
  const systemPrompt = `Você é um especialista em desenvolvimento web e design responsivo.
Sua tarefa é criar landing pages bonitas, modernas e TOTALMENTE RESPONSIVAS.

Regras importantes:
1. Gere apenas código HTML, CSS e JavaScript (sem explicações).
2. Use Bootstrap 5 ou Tailwind CSS para garantir responsividade.
3. Inclua a meta tag viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0">
4. Use unidades relativas (%, rem, em) em vez de pixels fixos.
5. Implemente media queries para ajustes específicos.
6. Certifique-se de que imagens e elementos sejam fluidos.
7. Use classes de grid responsivas.
8. Teste o layout em diferentes tamanhos de tela.
9. Certifique-se de que o texto seja legível em todos os dispositivos.
10. Implemente um menu de navegação que se adapte a dispositivos móveis.

Ao responder, forneça o código HTML completo da landing page, incluindo CSS e JavaScript embutidos.`;

  try {
    // Criar um stream de resposta
    const encoder = new TextEncoder();
    let currentMessageContent = '';
    let currentHtml = global.deepsiteSessions[sessionId].html || '';

    // Criar um stream de resposta
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Verificar se o cliente OpenAI está disponível
          if (!openai) {
            console.warn('Cliente OpenAI não disponível. Usando resposta de fallback.');
            
            // Criar uma resposta de fallback
            const fallbackHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page Responsiva</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .hero {
      background-color: #f8f9fa;
      padding: 80px 0;
    }
    .feature-icon {
      font-size: 2.5rem;
      color: #0d6efd;
      margin-bottom: 1rem;
    }
    .cta-section {
      background-color: #0d6efd;
      color: white;
      padding: 60px 0;
    }
  </style>
</head>
<body>
  <!-- Navbar responsivo -->
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <a class="navbar-brand" href="#">MinhaMarca</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link active" href="#">Início</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Recursos</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Preços</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Contato</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- Seção Hero -->
  <section class="hero">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-lg-6">
          <h1 class="display-4 fw-bold mb-4">Landing Page Responsiva</h1>
          <p class="lead mb-4">Esta é uma landing page responsiva de exemplo criada com Bootstrap 5.</p>
          <div class="d-grid gap-2 d-md-flex justify-content-md-start">
            <button type="button" class="btn btn-primary btn-lg px-4 me-md-2">Começar</button>
            <button type="button" class="btn btn-outline-secondary btn-lg px-4">Saiba mais</button>
          </div>
        </div>
        <div class="col-lg-6">
          <img src="https://via.placeholder.com/600x400" class="img-fluid rounded" alt="Hero Image">
        </div>
      </div>
    </div>
  </section>

  <!-- Seção de recursos -->
  <section class="py-5">
    <div class="container">
      <div class="row text-center mb-5">
        <div class="col-12">
          <h2 class="fw-bold">Nossos Recursos</h2>
          <p class="lead">Descubra o que temos a oferecer</p>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4 mb-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="feature-icon">🚀</div>
              <h5 class="card-title">Rápido e Responsivo</h5>
              <p class="card-text">Design totalmente responsivo que se adapta a qualquer dispositivo.</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="feature-icon">⚙️</div>
              <h5 class="card-title">Fácil de Personalizar</h5>
              <p class="card-text">Personalize facilmente para atender às suas necessidades específicas.</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <div class="feature-icon">📱</div>
              <h5 class="card-title">Mobile-First</h5>
              <p class="card-text">Otimizado para dispositivos móveis desde o início.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Seção CTA -->
  <section class="cta-section">
    <div class="container text-center">
      <h2 class="fw-bold mb-4">Pronto para começar?</h2>
      <p class="lead mb-4">Junte-se a milhares de usuários satisfeitos hoje mesmo.</p>
      <button class="btn btn-light btn-lg px-5">Inscreva-se agora</button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-dark text-white py-4">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h5>MinhaMarca</h5>
          <p>Criando experiências digitais incríveis.</p>
        </div>
        <div class="col-md-6 text-md-end">
          <p>&copy; 2023 MinhaMarca. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

            // Atualizar o HTML da sessão
            global.deepsiteSessions[sessionId].html = fallbackHtml;
            global.deepsiteSessions[sessionId].updatedAt = new Date();
            
            // Enviar atualização de HTML
            const htmlUpdate = {
              type: 'html',
              content: fallbackHtml
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(htmlUpdate)}\n\n`));
            
            // Enviar mensagem de erro
            const messageUpdate = {
              type: 'message',
              content: "Não foi possível conectar à API da OpenAI. Uma landing page responsiva de exemplo foi gerada. Para usar a funcionalidade completa de IA, configure a variável de ambiente OPENAI_API_KEY."
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageUpdate)}\n\n`));
            
            // Finalizar o stream
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          // Chamar a API da OpenAI
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 4000,
          });

          // Processar a resposta da API
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              currentMessageContent += content;
              
              // Verificar se o conteúdo parece ser HTML
              if (currentMessageContent.includes('<html') || 
                  currentMessageContent.includes('<!DOCTYPE') || 
                  currentMessageContent.includes('<body')) {
                
                // Atualizar o HTML da sessão
                currentHtml = currentMessageContent;
                global.deepsiteSessions[sessionId].html = currentHtml;
                global.deepsiteSessions[sessionId].updatedAt = new Date();
                
                // Enviar atualização de HTML
                const htmlUpdate = {
                  type: 'html',
                  content: currentHtml
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(htmlUpdate)}\n\n`));
              }
            }
          }

          // Enviar a mensagem final
          if (currentMessageContent) {
            // Armazenar a mensagem na sessão
            if (!global.deepsiteSessions[sessionId].messages) {
              global.deepsiteSessions[sessionId].messages = [];
            }
            global.deepsiteSessions[sessionId].messages.push({
              role: 'assistant',
              content: currentMessageContent
            });
            
            // Enviar a mensagem completa
            const messageUpdate = {
              type: 'message',
              content: currentMessageContent
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageUpdate)}\n\n`));
          }

          // Finalizar o stream
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Erro ao processar stream da IA:', error);
          controller.error(error);
        }
      }
    });

    return stream;
  } catch (error) {
    console.error('Erro ao criar stream de resposta:', error);
    throw error;
  }
}

// Declaração global para TypeScript
declare global {
  // eslint-disable-next-line no-var
  var deepsiteSessions: Record<string, DeepSiteSession>;
} 