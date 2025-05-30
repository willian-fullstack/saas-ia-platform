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
  if (global.deepsiteSessions?.[sessionId]) {
    global.deepsiteSessions[sessionId].content = content;
    global.deepsiteSessions[sessionId].html = content; // Atualizar ambos os campos para compatibilidade
    global.deepsiteSessions[sessionId].lastActivity = new Date();
    return true;
  }
  return false;
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