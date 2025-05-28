import sanitizeHtml from 'sanitize-html';
import fs from 'fs';
import path from 'path';
import type { JSDOM } from 'jsdom';
import type * as cheerio from 'cheerio';
import { applyDiffs } from './diff-utils';

// Importações dinâmicas para JSDOM e cheerio
async function getJSDOM(): Promise<typeof JSDOM> {
  const { JSDOM } = await import('jsdom');
  return JSDOM;
}

async function getCheerio(): Promise<typeof cheerio> {
  return await import('cheerio');
}

/**
 * Opções para sanitização de HTML
 */
export const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 
    'g', 'defs', 'use', 'linearGradient', 'radialGradient', 'stop', 'clipPath',
    'text', 'tspan', 'pattern', 'mask', 'filter', 'feGaussianBlur', 'feOffset',
    'feComponentTransfer', 'feColorMatrix', 'feBlend', 'feFlood'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'style'],
    'svg': ['viewBox', 'width', 'height', 'xmlns', 'fill', 'stroke', 'preserveAspectRatio', 'xmlns:xlink'],
    'path': ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'stroke-dasharray'],
    'circle': ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
    'rect': ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'rx', 'ry'],
    'g': ['transform', 'fill', 'stroke'],
    'stop': ['offset', 'stop-color', 'stop-opacity'],
    'linearGradient': ['id', 'x1', 'x2', 'y1', 'y2', 'gradientUnits', 'gradientTransform'],
    'radialGradient': ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits', 'gradientTransform'],
    'a': ['href', 'target', 'rel', 'download', 'name']
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
      'background-attachment': [/.*/],
      'text-align': [/.*/],
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
      'font': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'font-family': [/.*/],
      'font-style': [/.*/],
      'line-height': [/.*/],
      'letter-spacing': [/.*/],
      'text-decoration': [/.*/],
      'text-transform': [/.*/],
      'text-shadow': [/.*/],
      'display': [/.*/],
      'position': [/.*/],
      'top': [/.*/],
      'right': [/.*/],
      'bottom': [/.*/],
      'left': [/.*/],
      'width': [/.*/],
      'height': [/.*/],
      'max-width': [/.*/],
      'max-height': [/.*/],
      'min-width': [/.*/],
      'min-height': [/.*/],
      'z-index': [/.*/],
      'border': [/.*/],
      'border-top': [/.*/],
      'border-right': [/.*/],
      'border-bottom': [/.*/],
      'border-left': [/.*/],
      'border-width': [/.*/],
      'border-style': [/.*/],
      'border-color': [/.*/],
      'border-radius': [/.*/],
      'box-shadow': [/.*/],
      'opacity': [/.*/],
      'transition': [/.*/],
      'transition-property': [/.*/],
      'transition-duration': [/.*/],
      'transition-timing-function': [/.*/],
      'transform': [/.*/],
      'transform-origin': [/.*/],
      'animation': [/.*/],
      'animation-name': [/.*/],
      'animation-duration': [/.*/],
      'animation-timing-function': [/.*/],
      'animation-delay': [/.*/],
      'animation-iteration-count': [/.*/],
      'animation-direction': [/.*/],
      'animation-fill-mode': [/.*/],
      'flex': [/.*/],
      'flex-direction': [/.*/],
      'flex-wrap': [/.*/],
      'flex-grow': [/.*/],
      'flex-shrink': [/.*/],
      'flex-basis': [/.*/],
      'justify-content': [/.*/],
      'align-items': [/.*/],
      'align-self': [/.*/],
      'gap': [/.*/],
      'grid': [/.*/],
      'grid-template-columns': [/.*/],
      'grid-template-rows': [/.*/],
      'grid-column': [/.*/],
      'grid-row': [/.*/],
      'grid-gap': [/.*/],
      'overflow': [/.*/],
      'overflow-x': [/.*/],
      'overflow-y': [/.*/],
      'cursor': [/.*/],
      'visibility': [/.*/],
      'filter': [/.*/],
      'backdrop-filter': [/.*/]
    }
  }
};

/**
 * Remove dependências externas do HTML e as substitui por alternativas inline.
 * @param {string} html - O HTML a ser processado.
 * @returns {string} - HTML sem dependências externas.
 */
export function removeDependencias(html: string): string {
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

/**
 * Processa o HTML da landing page substituindo as tags de imagem.
 * 
 * @param html - O HTML da landing page
 * @param imageUrls - URLs das imagens a serem usadas
 * @returns O HTML processado
 */
export async function processLandingPageHtml(html: string, imageUrls: string[]): Promise<string> {
  // Importação dinâmica para evitar problemas de SSR
  const JSDOM = await getJSDOM();
  
  // Criar um documento DOM a partir do HTML para manipular
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Processar tags de imagem com formato __IMG_N__
  const imgTags = Array.from(document.querySelectorAll('img'));
  imgTags.forEach((img: Element) => {
    const src = img.getAttribute('src');
    if (src && src.includes('__IMG_')) {
      const imgMatch = src.match(/__IMG_(\d+)__/);
      const imgNumber = imgMatch ? parseInt(imgMatch[1]) : 1;
      if (imageUrls.length >= imgNumber && imageUrls[imgNumber - 1]) {
        img.setAttribute('src', imageUrls[imgNumber - 1]);
      }
    }
  });

  // Processar estilos CSS contendo referências a imagens
  const styleElements = Array.from(document.querySelectorAll('style'));
  styleElements.forEach((style: Element) => {
    if (style.textContent) {
      let cssText = style.textContent;
      let modified = false;
      
      // Substituir padrões de URL de imagens em CSS
      cssText = cssText.replace(/__IMG_(\d+)__/g, (match: string, imgNum: string) => {
        const num = parseInt(imgNum);
        if (imageUrls.length >= num && imageUrls[num - 1]) {
          modified = true;
          return imageUrls[num - 1];
        }
        return match;
      });
      
      if (modified) {
        style.textContent = cssText;
      }
    }
  });

  // Processar elementos com atributos style
  const elementsWithStyle = Array.from(document.querySelectorAll('[style]'));
  elementsWithStyle.forEach((element: Element) => {
    const styleAttr = element.getAttribute('style');
    if (styleAttr && styleAttr.includes('__IMG_')) {
      const modifiedStyle = styleAttr.replace(/__IMG_(\d+)__/g, (match: string, imgNum: string) => {
        const num = parseInt(imgNum);
        if (imageUrls.length >= num && imageUrls[num - 1]) {
          return imageUrls[num - 1];
        }
        return match;
      });
      
      if (styleAttr !== modifiedStyle) {
        element.setAttribute('style', modifiedStyle);
      }
    }
  });

  // Adicionar script de biblioteca
  const head = document.querySelector('head');
  if (head) {
    // Adicionar biblioteca AOS para animações (semelhante ao deepsite)
    const aosScript = document.createElement('script');
    aosScript.setAttribute('src', 'https://unpkg.com/aos@2.3.1/dist/aos.js');
    head.appendChild(aosScript);

    // Script para inicializar AOS
    const aosInitScript = document.createElement('script');
    aosInitScript.textContent = `
      document.addEventListener('DOMContentLoaded', function() {
        AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true
        });
      });
    `;
    head.appendChild(aosInitScript);
  }

  // Garantir que script de Bootstrap está presente (ou outros essenciais para funcionamento moderno)
  const body = document.querySelector('body');
  if (body) {
    const bootstrapScript = document.createElement('script');
    bootstrapScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js');
    body.appendChild(bootstrapScript);
  }

  // Adicionar meta tags essenciais para SEO e responsividade, se ausentes
  if (head) {
    // Viewport meta tag para responsividade
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      head.appendChild(viewportMeta);
    }

    // Meta description para SEO
    if (!document.querySelector('meta[name="description"]')) {
      const descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      descriptionMeta.setAttribute('content', 'Landing page gerada pelo sistema SAS-IA-Platform');
      head.appendChild(descriptionMeta);
    }
  }

  // Retornar o HTML completo processado
  return dom.serialize();
}

/**
 * Atualiza uma landing page existente aplicando diffs sugeridos pela IA
 * 
 * @param originalHtml - HTML original da landing page
 * @param aiSuggestedChanges - Sugestões de mudanças no formato diff
 * @returns HTML atualizado
 */
export function updateLandingPage(originalHtml: string, aiSuggestedChanges: string): string {
  try {
    // Usar a lógica de diff para aplicar as mudanças de forma segura e robusta
    return applyDiffs(originalHtml, aiSuggestedChanges);
  } catch (error: any) {
    console.error('Erro ao aplicar updates na landing page:', error);
    throw new Error(`Falha ao aplicar alterações sugeridas: ${error.message}`);
  }
}

/**
 * Valida e sanitiza o HTML da landing page para evitar problemas de segurança
 * 
 * @param html - HTML da landing page
 * @returns HTML sanitizado
 */
export async function sanitizeLandingPageHtml(html: string): Promise<string> {
  // Importação dinâmica
  const cheerioModule = await getCheerio();
  
  // Usar cheerio para analisar e sanitizar o HTML
  const $ = cheerioModule.load(html, {
    decodeEntities: false, // Manter acentos e caracteres especiais
  });
  
  // Remover scripts potencialmente perigosos
  $('script').each((_, element) => {
    const src = $(element).attr('src');
    const content = $(element).html();
    
    // Manter apenas scripts de bibliotecas confiáveis e sem código malicioso
    const allowedDomains = [
      'cdn.jsdelivr.net', 
      'unpkg.com', 
      'code.jquery.com',
      'cdnjs.cloudflare.com'
    ];
    
    const isAllowed = src && allowedDomains.some(domain => src.includes(domain));
    
    // Remover scripts inline que não sejam para inicialização de bibliotecas conhecidas
    const isCleanInit = content && (
      content.includes('AOS.init') || 
      content.includes('new Swiper') ||
      content.includes('DOMContentLoaded')
    );
    
    if (!isAllowed && !isCleanInit) {
      $(element).remove();
    }
  });
  
  // Remover atributos on* para evitar XSS
  $('*').each((_, element) => {
    Object.keys(element.attribs || {}).forEach(attr => {
      if (attr.startsWith('on')) {
        $(element).removeAttr(attr);
      }
    });
  });
  
  // Garantir que os links externos abram em nova aba e tenham rel="noopener"
  $('a[href^="http"]').each((_, element) => {
    $(element).attr('target', '_blank');
    $(element).attr('rel', 'noopener noreferrer');
  });
  
  return $.html();
}

/**
 * Salva a landing page em disco
 * 
 * @param html - HTML da landing page
 * @param filename - Nome do arquivo
 * @param outputDir - Diretório de saída
 * @returns Caminho do arquivo salvo
 */
export function saveLandingPage(html: string, filename: string, outputDir: string): string {
  try {
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Sanitizar o nome do arquivo
    const sanitizedFilename = filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const fullPath = path.join(outputDir, `${sanitizedFilename}.html`);
    
    // Salvar o arquivo
    fs.writeFileSync(fullPath, html, 'utf8');
    
    return fullPath;
  } catch (error: any) {
    console.error('Erro ao salvar landing page:', error);
    throw new Error(`Não foi possível salvar a landing page: ${error.message}`);
  }
}

/**
 * Adiciona recursos extras à landing page (analytics, pixel, etc)
 * 
 * @param html - HTML da landing page
 * @param config - Configuração com os recursos a adicionar
 * @returns HTML com recursos adicionados
 */
export async function addTrackingToLandingPage(html: string, config: {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  gtmId?: string;
}): Promise<string> {
  const JSDOM = await getJSDOM();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const head = document.querySelector('head');
  const body = document.querySelector('body');
  
  if (!head || !body) {
    throw new Error('HTML inválido: faltando elementos head ou body');
  }
  
  // Adicionar Google Analytics (se configurado)
  if (config.googleAnalyticsId) {
    const gaScript = document.createElement('script');
    gaScript.setAttribute('async', '');
    gaScript.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`);
    head.appendChild(gaScript);
    
    const gaConfigScript = document.createElement('script');
    gaConfigScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${config.googleAnalyticsId}');
    `;
    head.appendChild(gaConfigScript);
  }
  
  // Adicionar Facebook Pixel (se configurado)
  if (config.facebookPixelId) {
    const fbPixelScript = document.createElement('script');
    fbPixelScript.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${config.facebookPixelId}');
      fbq('track', 'PageView');
    `;
    head.appendChild(fbPixelScript);
    
    const fbPixelNoscript = document.createElement('noscript');
    fbPixelNoscript.innerHTML = `
      <img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${config.facebookPixelId}&ev=PageView&noscript=1"/>
    `;
    body.insertBefore(fbPixelNoscript, body.firstChild);
  }
  
  // Adicionar Google Tag Manager (se configurado)
  if (config.gtmId) {
    const gtmHeadScript = document.createElement('script');
    gtmHeadScript.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${config.gtmId}');
    `;
    head.appendChild(gtmHeadScript);
    
    const gtmBodyNoscript = document.createElement('noscript');
    gtmBodyNoscript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    body.insertBefore(gtmBodyNoscript, body.firstChild);
  }
  
  return dom.serialize();
}

/**
 * Adiciona meta tags de SEO à landing page
 * 
 * @param html - HTML da landing page
 * @param seoConfig - Configuração de SEO
 * @returns HTML com meta tags de SEO
 */
export async function addSeoMetaTags(html: string, seoConfig: {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}): Promise<string> {
  const JSDOM = await getJSDOM();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const head = document.querySelector('head');
  
  if (!head) {
    throw new Error('HTML inválido: elemento head não encontrado');
  }
  
  // Função auxiliar para adicionar ou atualizar meta tag
  const setMetaTag = (name: string, content: string, property?: string) => {
    let meta = null;
    
    if (property) {
      meta = document.querySelector(`meta[property="${property}"]`);
    } else {
      meta = document.querySelector(`meta[name="${name}"]`);
    }
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property) {
        meta.setAttribute('property', property);
      } else {
        meta.setAttribute('name', name);
      }
      head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };
  
  // Atualizar título se fornecido
  if (seoConfig.title) {
    let title = document.querySelector('title');
    if (!title) {
      title = document.createElement('title');
      head.appendChild(title);
    }
    title.textContent = seoConfig.title;
    
    // Adicionar Open Graph title
    setMetaTag('og:title', seoConfig.title, 'og:title');
  }
  
  // Adicionar descrição se fornecida
  if (seoConfig.description) {
    setMetaTag('description', seoConfig.description);
    setMetaTag('og:description', seoConfig.description, 'og:description');
  }
  
  // Adicionar keywords se fornecidas
  if (seoConfig.keywords) {
    setMetaTag('keywords', seoConfig.keywords);
  }
  
  // Adicionar imagem Open Graph se fornecida
  if (seoConfig.ogImage) {
    setMetaTag('og:image', seoConfig.ogImage, 'og:image');
  }
  
  // Adicionar URL Open Graph se fornecida
  if (seoConfig.ogUrl) {
    setMetaTag('og:url', seoConfig.ogUrl, 'og:url');
  }
  
  // Adicionar tipo Open Graph se fornecido
  if (seoConfig.ogType) {
    setMetaTag('og:type', seoConfig.ogType, 'og:type');
  } else {
    setMetaTag('og:type', 'website', 'og:type');
  }
  
  // Sempre adicionar locale pt_BR para o Brasil
  setMetaTag('og:locale', 'pt_BR', 'og:locale');
  
  return dom.serialize();
} 