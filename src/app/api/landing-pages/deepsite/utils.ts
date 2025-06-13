/**
 * Utilitários para o recurso DeepSite - Editor avançado de landing pages
 */

import { v4 as uuidv4 } from 'uuid';
import sanitizeHtml from 'sanitize-html';

// Armazenamento de sessões em memória (para desenvolvimento)
interface DeepSiteSession {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  content: string;
  html?: string; // Alias para compatibilidade com outras partes do sistema
  name: string;
  landingPageId?: string; // ID da landing page associada, se houver
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
}

// Declare variável global para armazenar sessões
declare global {
  var deepsiteSessions: {
    [sessionId: string]: DeepSiteSession;
  };
}

// Inicializar armazenamento de sessões globalmente
export function initSessionStorage() {
  if (typeof global.deepsiteSessions === 'undefined') {
    global.deepsiteSessions = {};
    console.log('Armazenamento de sessões DeepSite inicializado');
  }
}

// Criar uma nova sessão
export function createSession(userId: string, content: string, name: string): string {
  const sessionId = uuidv4();
  
  global.deepsiteSessions[sessionId] = {
    sessionId,
    userId,
    createdAt: new Date(),
    lastActivity: new Date(),
    content,
    name,
    messages: []
  };
  
  console.log(`Nova sessão DeepSite criada: ${sessionId} para usuário: ${userId}`);
  
  // Limpar sessões antigas (mais de 24 horas sem atividade)
  cleanupOldSessions();
  
  return sessionId;
}

// Obter conteúdo HTML de uma sessão
export function getSessionContent(sessionId: string): string | null {
  if (!global.deepsiteSessions?.[sessionId]) {
    return null;
  }
  
  const session = global.deepsiteSessions[sessionId];
  
  // Retornar o conteúdo, independentemente de qual campo está sendo usado
  return session.content || session.html || '';
}

// Atualizar conteúdo de uma sessão
export function updateSessionContent(sessionId: string, content: string): boolean {
  if (!global.deepsiteSessions?.[sessionId]) {
    console.error(`Sessão não encontrada: ${sessionId}`);
    return false;
  }
  
  if (!content || content.trim() === '') {
    console.warn(`Tentativa de atualizar sessão ${sessionId} com conteúdo vazio`);
  } else {
    console.log(`Atualizando sessão ${sessionId} com conteúdo de ${content.length} caracteres`);
  }
  
  // Armazenar o conteúdo em ambos os campos para garantir compatibilidade
  global.deepsiteSessions[sessionId].content = content;
  global.deepsiteSessions[sessionId].html = content; 
  global.deepsiteSessions[sessionId].lastActivity = new Date();
  
  // Se a sessão tem uma landing page associada, registrar para debug
  if (global.deepsiteSessions[sessionId].landingPageId) {
    console.log(`Sessão ${sessionId} está associada à landing page ${global.deepsiteSessions[sessionId].landingPageId}`);
  }
  
  return true;
}

// Adicionar mensagem a uma sessão
export function addSessionMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean {
  if (global.deepsiteSessions?.[sessionId]) {
    global.deepsiteSessions[sessionId].messages.push({
      role,
      content,
      timestamp: new Date()
    });
    global.deepsiteSessions[sessionId].lastActivity = new Date();
    return true;
  }
  return false;
}

// Remover sessões antigas
function cleanupOldSessions() {
  const now = new Date();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
  
  Object.keys(global.deepsiteSessions).forEach(sessionId => {
    const session = global.deepsiteSessions[sessionId];
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
    
    if (timeSinceLastActivity > expirationTime) {
      delete global.deepsiteSessions[sessionId];
      console.log(`Sessão expirada removida: ${sessionId}`);
    }
  });
}

// Opções de sanitização para HTML - Configuração permitindo elementos comuns e seguros
export const sanitizeOptions = {
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

/**
 * Funções que estavam sendo importadas no route.ts
 */

// Sanitiza o HTML da landing page
export function sanitizeLandingPageHtml(html: string): string {
  try {
    return sanitizeHtml(html, sanitizeOptions);
  } catch (error) {
    console.error('Erro ao sanitizar HTML:', error);
    return html; // Em caso de erro, retorna o HTML original
  }
}

// Processa o HTML da landing page
export function processLandingPageHtml(html: string): string {
  try {
    // Primeiro sanitiza o HTML
    let processedHtml = sanitizeLandingPageHtml(html);
    
    // Aqui você pode adicionar outras transformações necessárias
    // Por exemplo, corrigir links relativos, adicionar classes, etc.
    
    return processedHtml;
  } catch (error) {
    console.error('Erro ao processar HTML:', error);
    return html; // Em caso de erro, retorna o HTML original
  }
}

// Adiciona meta tags de SEO ao HTML
export function addSeoMetaTags(html: string, metadata: { 
  title?: string; 
  description?: string; 
  keywords?: string;
  ogImage?: string;
}): string {
  try {
    const { title, description, keywords, ogImage } = metadata;
    
    // Verifica se o HTML tem a tag head
    if (!html.includes('<head>')) {
      html = html.replace('<html>', '<html><head></head>');
    }
    
    // Prepara as meta tags
    let metaTags = '';
    
    if (title) {
      metaTags += `<title>${title}</title>\n`;
      metaTags += `<meta property="og:title" content="${title}" />\n`;
    }
    
    if (description) {
      metaTags += `<meta name="description" content="${description}" />\n`;
      metaTags += `<meta property="og:description" content="${description}" />\n`;
    }
    
    if (keywords) {
      metaTags += `<meta name="keywords" content="${keywords}" />\n`;
    }
    
    if (ogImage) {
      metaTags += `<meta property="og:image" content="${ogImage}" />\n`;
    }
    
    // Adiciona viewport para responsividade
    metaTags += `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n`;
    
    // Adiciona as meta tags ao head
    html = html.replace('<head>', `<head>\n${metaTags}`);
    
    return html;
  } catch (error) {
    console.error('Erro ao adicionar meta tags de SEO:', error);
    return html; // Em caso de erro, retorna o HTML original
  }
}

// Adiciona scripts de tracking à landing page
export function addTrackingToLandingPage(html: string, trackingConfig: {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customScript?: string;
}): string {
  try {
    const { googleAnalyticsId, facebookPixelId, customScript } = trackingConfig;
    
    let trackingScripts = '';
    
    // Google Analytics
    if (googleAnalyticsId) {
      trackingScripts += `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${googleAnalyticsId}');
</script>
`;
    }
    
    // Facebook Pixel
    if (facebookPixelId) {
      trackingScripts += `
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${facebookPixelId}');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1"
/></noscript>
`;
    }
    
    // Script personalizado
    if (customScript) {
      trackingScripts += `
<!-- Script personalizado -->
${customScript}
`;
    }
    
    // Adiciona os scripts antes do fechamento do body
    if (trackingScripts) {
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${trackingScripts}</body>`);
      } else {
        html += trackingScripts;
      }
    }
    
    return html;
  } catch (error) {
    console.error('Erro ao adicionar scripts de tracking:', error);
    return html; // Em caso de erro, retorna o HTML original
  }
} 