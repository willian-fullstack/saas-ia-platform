/**
 * Utilitários gerais para o DeepSite
 * 
 * Este módulo fornece funções e configurações utilitárias para o sistema DeepSite.
 */

import { v4 as uuidv4 } from 'uuid';
import sanitizeHtml from 'sanitize-html';

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

// Declaração global para TypeScript
declare global {
  // eslint-disable-next-line no-var
  var deepsiteSessions: Record<string, DeepSiteSession>;
} 