/**
 * Templates e Guias de Referência para Landing Pages
 * 
 * Este arquivo serve como referência para a geração de landing pages profissionais
 * através da API. Ele define estruturas, estilos e melhores práticas para
 * diferentes tipos de landing pages.
 * 
 * NOTA: A implementação atual gera HTML, CSS e JavaScript separados
 * diretamente através da API, seguindo as melhores práticas de desenvolvimento web.
 */

// Interface que define as opções para templates
export interface TemplateOptions {
  title?: string;               // Título da página
  description?: string;         // Descrição para SEO
  primaryColor?: string;        // Cor principal do tema
  secondaryColor?: string;      // Cor secundária do tema
  accentColor?: string;         // Cor de destaque
  logoText?: string;            // Texto do logo
  heroTitle?: string;           // Título principal da seção hero
  heroSubtitle?: string;        // Subtítulo da seção hero
  ctaText?: string;             // Texto do botão de call-to-action
  benefits: string[];           // Lista de benefícios do produto/serviço
  testimonials?: {              // Depoimentos de clientes
    name: string;               // Nome do cliente
    role: string;               // Cargo/posição do cliente
    text: string;               // Texto do depoimento
  }[];
  pricing?: string;             // Informações de preço
  contactEmail?: string;        // Email de contato
  phoneNumber?: string;         // Número de telefone
  footerText?: string;          // Texto do rodapé
  imageMarkers?: string[];      // Marcadores para imagens a serem geradas
}

/**
 * Biblioteca de Estilos de Landing Pages
 * 
 * Esta seção define os diferentes estilos de landing pages disponíveis,
 * suas características visuais e casos de uso recomendados.
 */
export const LANDING_PAGE_STYLES = {
  moderno: {
    id: "moderno",
    name: "Moderno",
    description: "Design contemporâneo e elegante com elementos visuais impressionantes e interatividade refinada.",
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981",
      accent: "#8B5CF6"
    },
    recommendedFor: ["SaaS", "Aplicativos", "Startups", "Produtos Digitais"],
    features: [
      "Gradientes vibrantes e cards com sombras expressivas",
      "Tipografia contrastante e variável",
      "Micro-animações em elementos interativos",
      "Layouts assimétricos e dinâmicos",
      "Backgrounds com formas abstratas ou ondulações",
      "Esquema de cores vivas e complementares"
    ]
  },
  minimalista: {
    id: "minimalista",
    name: "Minimalista",
    description: "Design clean e refinado com foco no essencial, tipografia elegante e amplo espaço negativo.",
    colors: {
      primary: "#171717",
      secondary: "#737373",
      accent: "#f5f5f5"
    },
    recommendedFor: ["Portfólios", "Fotografia", "Design", "Arquitetura", "Produtos Premium"],
    features: [
      "Tipografia refinada sem serifa",
      "Paleta monocromática com acento sutil",
      "Ícones minimalistas de linha fina",
      "Amplo espaço em branco estratégico",
      "Grid simétrico e matemático",
      "Foco extremo no conteúdo com poucos elementos visuais"
    ]
  },
  vendas: {
    id: "vendas",
    name: "Vendas",
    description: "Otimizado para maximizar conversões com elementos persuasivos, urgência e prova social destacada.",
    colors: {
      primary: "#DC2626",
      secondary: "#FBBF24",
      accent: "#2563EB"
    },
    recommendedFor: ["Produtos Físicos", "Infoprodutos", "Eventos", "Webinars", "Ofertas especiais"],
    features: [
      "Headlines emocionais e chamativas",
      "Múltiplos CTAs de alto contraste",
      "Contadores regressivos e elementos de urgência",
      "Badges de segurança e garantias destacadas",
      "Depoimentos com fotos e backgrounds",
      "Listas de benefícios com ícones marcantes"
    ]
  },
  corporativo: {
    id: "corporativo",
    name: "Corporativo",
    description: "Visual profissional e confiável que transmite credibilidade, estabilidade e experiência.",
    colors: {
      primary: "#0F172A",
      secondary: "#64748B",
      accent: "#0EA5E9"
    },
    recommendedFor: ["Empresas B2B", "Serviços Profissionais", "Consultoria", "Finanças", "Seguros"],
    features: [
      "Tipografia serifa para títulos com sans-serif para corpo",
      "Cores institucionais conservadoras",
      "Layouts estruturados com grid bem definido",
      "Ícones sólidos e profissionais",
      "Imagens corporativas de alta qualidade",
      "Elementos que transmitem confiabilidade e autoridade"
    ]
  },
  startup: {
    id: "startup",
    name: "Startup",
    description: "Design arrojado e disruptivo com elementos visualmente impressionantes e inovadores.",
    colors: {
      primary: "#7E22CE",
      secondary: "#EC4899",
      accent: "#3B82F6"
    },
    recommendedFor: ["Startups", "Apps", "Tecnologia", "Produtos Inovadores", "Soluções Digitais"],
    features: [
      "Cores saturadas e vibrantes com degradês futuristas",
      "Ilustrações personalizadas vetoriais ou 3D",
      "Tipografia heavy sans-serif impactante",
      "Elementos lúdicos e interativos",
      "Layouts não convencionais com seções sobrepostas",
      "Visual que comunica inovação e disrução"
    ]
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce",
    description: "Focado em apresentação de produtos com excelente navegação e elementos de compra otimizados.",
    colors: {
      primary: "#0369A1",
      secondary: "#059669",
      accent: "#FB923C"
    },
    recommendedFor: ["Lojas Online", "Marketplace", "Produtos Físicos", "Dropshipping"],
    features: [
      "Grids de imagens de produtos de alta qualidade",
      "Galerias interativas com zoom e visualização 360°",
      "Badges de promoção visualmente atraentes",
      "Elementos de carrinho/compra proeminentes",
      "Cartões de produto com hover effects",
      "Reviews de produtos com rating visual"
    ]
  }
};

/**
 * Elementos Essenciais por Tipo de Landing Page
 * 
 * Guia de referência para os componentes essenciais que cada tipo de landing page
 * deve incluir para maximizar sua eficácia.
 */
export const LANDING_PAGE_COMPONENTS = {
  // Componentes essenciais para landing pages de vendas
  VENDAS: [
    'Hero section com headline emocional e CTA claro',
    'Elementos de urgência (contadores, avisos de estoque)',
    'Múltiplos CTAs ao longo da página',
    'Seção de garantia e devolução destacada',
    'Depoimentos detalhados com fotos e resultados',
    'Comparação antes/depois',
    'FAQs para eliminar objeções',
    'Selos de segurança e confiança',
    'Pop-up de saída com oferta especial'
  ],
  
  // Componentes essenciais para landing pages de captura de leads
  LEADS: [
    'Formulário de captura simplificado e destacado',
    'Benefício claro da oferta gratuita',
    'Autoridade e credibilidade visível',
    'Explicação do que acontece após o cadastro',
    'Depoimentos de quem já se cadastrou',
    'Prévia do conteúdo oferecido',
    'FAQ curto para eliminar objeções'
  ],
  
  // Componentes essenciais para landing pages SaaS
  SAAS: [
    'Demo ou vídeo do produto em ação',
    'Listagem de recursos principais com ícones',
    'Testemunhos de usuários atuais',
    'Comparação de planos e preços',
    'Integrações disponíveis',
    'Seção "Como funciona" passo a passo',
    'CTA para período de teste gratuito',
    'Chat de suporte ou FAQ técnico'
  ],
  
  // Componentes comuns a todas as landing pages
  COMUM: [
    'Header com logo e navegação simplificada',
    'Hero section com headline e subheadline claros',
    'CTA principal destacado visualmente',
    'Seção de benefícios com elementos visuais',
    'Prova social (depoimentos, logotipos, números)',
    'FAQ para eliminar objeções comuns',
    'Footer com informações de contato e links legais'
  ]
};

// Função auxiliar para obter template baseado no estilo selecionado
export function getTemplateByStyle(style: string, options: TemplateOptions): string {
  // Normalizar estilo para comparação mais segura
  const normalizedStyle = style.toLowerCase().trim();
  
  // Selecionar o template apropriado com base no estilo
  if (normalizedStyle.includes('vend') || normalizedStyle === 'vendas') {
    return getSalesTemplate(options);
  } else if (normalizedStyle.includes('minimal') || normalizedStyle === 'minimalista') {
    return getMinimalistTemplate(options);
  } else if (normalizedStyle.includes('modern') || normalizedStyle === 'moderno') {
    return getModernTemplate(options);
  } else if (normalizedStyle.includes('corp') || normalizedStyle === 'corporativo') {
    return getCorporateTemplate(options);
  } else if (normalizedStyle.includes('start') || normalizedStyle === 'startup') {
    return getStartupTemplate(options);
  } else if (normalizedStyle.includes('commerce') || normalizedStyle === 'ecommerce') {
    return getEcommerceTemplate(options);
  }
  
  // Se não encontrou um estilo específico, usar o template base
  return getBaseTemplate(options);
}

// Template base usado como fallback
export function getBaseTemplate(options: TemplateOptions): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Landing Page'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="header-container">
        <a href="#" class="logo">${options.logoText || 'Brand'}</a>
        <nav class="nav-menu">
          <ul>
            <li><a href="#benefits">Benefícios</a></li>
            <li><a href="#about">Sobre</a></li>
            <li><a href="#testimonials">Depoimentos</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1>${options.heroTitle || options.title || 'Título Principal'}</h1>
          <p>${options.heroSubtitle || options.description || 'Subtítulo atraente para o público'}</p>
          <a href="#cta" class="btn btn-primary">${options.ctaText || 'Saiba Mais'}</a>
        </div>
      </div>
    </section>

    <section id="benefits" class="section">
      <div class="container">
        <h2 class="section-title">Benefícios</h2>
        <p class="section-subtitle">Conheça as vantagens do nosso produto/serviço</p>
        
        <div class="benefits">
          ${options.benefits.map((benefit, index) => `
            <div class="benefit-card">
              <div class="benefit-icon">${index + 1}</div>
              <h3>${benefit}</h3>
              <p>Descrição detalhada do benefício e como ele ajuda o cliente.</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    ${options.testimonials ? `
    <section id="testimonials" class="section testimonials">
      <div class="container">
        <h2 class="section-title">O que dizem nossos clientes</h2>
        <p class="section-subtitle">Veja a experiência de quem já utilizou</p>
        
        <div class="testimonial-grid">
          ${options.testimonials.map(testimonial => `
            <div class="testimonial-card">
              <div class="testimonial-content">
                <p>"${testimonial.text}"</p>
              </div>
              <div class="testimonial-author">
                <div class="testimonial-author-info">
                  <h4>${testimonial.name}</h4>
                  <p>${testimonial.role}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <section id="cta" class="section cta-section">
      <div class="container">
        <h2 class="section-title">Pronto para começar?</h2>
        <p>Não perca mais tempo. Garanta agora mesmo.</p>
        <a href="#" class="btn btn-primary">${options.ctaText || 'Quero Começar Agora'}</a>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-column">
          <h3>Sobre nós</h3>
          <p>Breve descrição sobre a empresa e sua missão.</p>
        </div>
        <div class="footer-column">
          <h3>Links úteis</h3>
          <ul>
            <li><a href="#">Início</a></li>
            <li><a href="#benefits">Benefícios</a></li>
            <li><a href="#testimonials">Depoimentos</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Contato</h3>
          <ul>
            <li>Email: ${options.contactEmail || 'contato@empresa.com'}</li>
            <li>Telefone: ${options.phoneNumber || '(00) 0000-0000'}</li>
          </ul>
        </div>
      </div>
      <div class="copyright">
        <p>${options.footerText || '© ' + new Date().getFullYear() + ' Todos os direitos reservados.'}</p>
      </div>
    </div>
  </footer>
</body>
</html>
  `;
}

export function getModernTemplate(options: TemplateOptions): string {
  // Template com estilo moderno (mais completo e visualmente atraente)
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Landing Page Moderna'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="modern-theme">
  <div class="bg-gradient"></div>
  
  <header class="header">
    <div class="container">
      <div class="header-container">
        <a href="#" class="logo">
          <span class="logo-text">${options.logoText || 'Brand'}</span>
        </a>
        <nav class="nav-menu">
          <ul>
            <li><a href="#benefits">Benefícios</a></li>
            <li><a href="#about">Sobre</a></li>
            <li><a href="#testimonials">Depoimentos</a></li>
            <li><a href="#contact" class="nav-cta">Contato</a></li>
          </ul>
        </nav>
        <button class="mobile-menu-toggle" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="animate-on-scroll">${options.heroTitle || options.title || 'Inovação em Cada Detalhe'}</h1>
          <p class="animate-on-scroll">${options.heroSubtitle || options.description || 'Descubra uma nova forma de transformar suas ideias em realidade com nosso produto inovador'}</p>
          <div class="hero-cta animate-on-scroll">
            <a href="#cta" class="btn btn-primary">${options.ctaText || 'Comece Agora'}</a>
            <a href="#about" class="btn btn-secondary">Saiba Mais</a>
          </div>
        </div>
        <div class="hero-image animate-on-scroll">
          <!-- Placeholder para imagem -->
          <div class="image-placeholder">
            <div class="animated-shape"></div>
            <div class="animated-shape"></div>
            <div class="animated-shape"></div>
          </div>
        </div>
      </div>
      <div class="hero-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="var(--bg-color)" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>

    <section id="benefits" class="section">
      <div class="container">
        <h2 class="section-title animate-on-scroll">Benefícios Exclusivos</h2>
        <p class="section-subtitle animate-on-scroll">Veja como podemos transformar sua experiência</p>
        
        <div class="benefits">
          ${options.benefits.map((benefit, index) => `
            <div class="benefit-card animate-on-scroll">
              <div class="benefit-icon">
                <span class="icon-circle">0${index + 1}</span>
              </div>
              <h3>${benefit}</h3>
              <p>Transforme sua experiência com nossos recursos exclusivos e diferenciais competitivos.</p>
            </div>
          `).join('')}
                          </div>
                      </div>
    </section>

    <section id="about" class="section about-section">
      <div class="container">
        <div class="about-grid">
          <div class="about-content animate-on-scroll">
            <h2 class="section-title">Nossa Solução</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis eget urna mattis efficitur. Maecenas eu odio sagittis, congue urna vel, finibus magna.</p>
            <ul class="feature-list">
              <li>
                <span class="check-icon">✓</span>
                <span>Recurso inovador que destaca seu produto</span>
              </li>
              <li>
                <span class="check-icon">✓</span>
                <span>Funcionalidade exclusiva para melhor desempenho</span>
              </li>
              <li>
                <span class="check-icon">✓</span>
                <span>Sistema avançado de gerenciamento</span>
              </li>
            </ul>
            <a href="#cta" class="btn btn-primary-outline">Descubra Mais</a>
                  </div>
          <div class="about-image animate-on-scroll">
            <!-- Placeholder para imagem -->
            <div class="image-placeholder gradient-box">
              <div class="inner-content">Imagem do Produto</div>
              </div>
          </div>
          </div>
      </div>
    </section>

    ${options.testimonials ? `
    <section id="testimonials" class="section testimonials">
      <div class="container">
        <h2 class="section-title animate-on-scroll">O que dizem nossos clientes</h2>
        <p class="section-subtitle animate-on-scroll">Experiências reais de pessoas como você</p>
        
        <div class="testimonial-grid">
          ${options.testimonials.map(testimonial => `
            <div class="testimonial-card animate-on-scroll">
              <div class="testimonial-stars">★★★★★</div>
              <div class="testimonial-content">
                <p>"${testimonial.text}"</p>
              </div>
              <div class="testimonial-author">
                <div class="testimonial-avatar"></div>
                <div class="testimonial-author-info">
                  <h4>${testimonial.name}</h4>
                  <p>${testimonial.role}</p>
                  </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <section id="cta" class="section cta-section">
      <div class="container">
        <div class="cta-card animate-on-scroll">
          <h2 class="section-title">Pronto para transformar?</h2>
          <p>Junte-se a milhares de clientes satisfeitos e eleve sua experiência a outro nível.</p>
          <a href="#" class="btn btn-primary">${options.ctaText || 'Começar Agora'}</a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-column">
          <a href="#" class="footer-logo">
            <span class="logo-text">${options.logoText || 'Brand'}</span>
          </a>
          <p>Transformando ideias em soluções inovadoras para um futuro melhor.</p>
          <div class="social-icons">
            <a href="#" aria-label="Facebook"><span class="social-icon">f</span></a>
            <a href="#" aria-label="Twitter"><span class="social-icon">t</span></a>
            <a href="#" aria-label="Instagram"><span class="social-icon">i</span></a>
            <a href="#" aria-label="LinkedIn"><span class="social-icon">l</span></a>
          </div>
        </div>
        <div class="footer-column">
          <h3>Links</h3>
          <ul>
            <li><a href="#">Início</a></li>
            <li><a href="#benefits">Benefícios</a></li>
            <li><a href="#about">Sobre</a></li>
            <li><a href="#testimonials">Depoimentos</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Contato</h3>
          <ul>
            <li><span class="contact-icon">✉</span> ${options.contactEmail || 'contato@empresa.com'}</li>
            <li><span class="contact-icon">☏</span> ${options.phoneNumber || '(00) 0000-0000'}</li>
            <li><span class="contact-icon">⌂</span> Endereço: Av. Principal, 123</li>
          </ul>
        </div>
        <div class="footer-column">
          <h3>Newsletter</h3>
          <p>Receba novidades e ofertas exclusivas.</p>
          <form class="footer-form">
            <input type="email" placeholder="Seu e-mail" required>
            <button type="submit" class="btn-form">Enviar</button>
          </form>
        </div>
      </div>
      <div class="copyright">
        <p>${options.footerText || '© ' + new Date().getFullYear() + ' ' + (options.logoText || 'Brand') + '. Todos os direitos reservados.'}</p>
        <div class="footer-links">
          <a href="#">Termos de Uso</a>
          <a href="#">Política de Privacidade</a>
          </div>
      </div>
    </div>
  </footer>
</body>
</html>
  `;
}

export function getMinimalistTemplate(options: TemplateOptions): string {
  // Template com estilo minimalista (clean e elegante)
  return `
<!DOCTYPE html>
<html lang="pt-BR">
    <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Landing Page Minimalista'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body class="minimal-theme">
  <header class="header">
    <div class="container">
      <div class="header-container">
        <a href="#" class="logo">${options.logoText || 'brand'}</a>
        <nav class="nav-menu">
          <ul>
            <li><a href="#benefits">benefícios</a></li>
            <li><a href="#about">sobre</a></li>
            <li><a href="#contact">contato</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-content animate-fade-in">
            <h1>${options.heroTitle || options.title || 'Simplicidade é sofisticação'}</h1>
            <p class="hero-subtitle">${options.heroSubtitle || options.description || 'Menos é mais. Conheça nossa abordagem minimalista para transformar sua experiência.'}</p>
            <a href="#cta" class="btn btn-minimal">${options.ctaText || 'Explorar'}</a>
          </div>
          <div class="hero-visual animate-fade-in">
            <div class="minimal-shape"></div>
          </div>
        </div>
      </div>
    </section>

    <section id="benefits" class="section">
      <div class="container">
        <h2 class="section-title animate-on-scroll">benefícios</h2>
        
        <div class="benefits-minimal">
          ${options.benefits.map((benefit, index) => `
            <div class="benefit-item animate-on-scroll">
              <span class="benefit-number">0${index + 1}</span>
              <div class="benefit-content">
                <h3>${benefit}</h3>
                <p>Uma abordagem elegante e funcional para atender suas necessidades com simplicidade.</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="about" class="section about-minimal">
      <div class="container">
        <div class="about-grid">
          <div class="about-content animate-on-scroll">
            <span class="section-label">sobre nós</span>
            <h2 class="section-title">Design com propósito</h2>
            <p>Acreditamos que o verdadeiro luxo está na simplicidade e na funcionalidade. Nossa abordagem minimalista elimina o desnecessário e foca no essencial.</p>
            <p>Cada elemento de nosso produto foi cuidadosamente considerado para oferecer a melhor experiência possível.</p>
          </div>
          <div class="about-visual animate-on-scroll">
            <div class="minimal-frame"></div>
          </div>
        </div>
      </div>
    </section>

    ${options.testimonials ? `
    <section id="testimonials" class="section testimonials-minimal">
      <div class="container">
        <span class="section-label">experiências</span>
        <h2 class="section-title animate-on-scroll">O que dizem</h2>
        
        <div class="testimonial-slider">
          ${options.testimonials.map(testimonial => `
            <div class="testimonial-minimal animate-on-scroll">
              <p class="testimonial-text">"${testimonial.text}"</p>
              <div class="testimonial-author">
                <span class="author-name">${testimonial.name}</span>
                <span class="author-title">${testimonial.role}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <section id="cta" class="section cta-minimal">
      <div class="container">
        <div class="cta-content animate-on-scroll">
          <h2>Pronto para simplificar?</h2>
          <a href="#" class="btn btn-minimal">${options.ctaText || 'Começar'}</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer-minimal">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <a href="#" class="logo">${options.logoText || 'brand'}</a>
        </div>
        <div class="footer-links">
          <a href="#">termos</a>
          <a href="#">privacidade</a>
          <a href="#">contato</a>
        </div>
      </div>
      <div class="copyright-minimal">
        <p>${options.footerText || '© ' + new Date().getFullYear()}</p>
      </div>
    </div>
  </footer>
</body>
</html>
  `;
}

export function getSalesTemplate(options: TemplateOptions): string {
  // Template de vendas otimizado para conversão
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'Landing Page de Vendas'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
    </head>
<body class="sales-theme">
  <div class="top-bar">
    <div class="container">
      <div class="top-bar-content">
        <p class="urgency-text">⚡ OFERTA ESPECIAL: Válida por tempo limitado!</p>
      </div>
    </div>
  </div>
  
  <header class="header">
    <div class="container">
      <div class="header-container">
        <a href="#" class="logo">${options.logoText || 'Brand'}</a>
        <div class="header-cta">
          <a href="#cta" class="btn btn-header-cta">GARANTA AGORA</a>
        </div>
      </div>
    </div>
  </header>

        <main>
    <section class="hero sales-hero">
                <div class="container">
        <div class="hero-grid">
          <div class="hero-content">
            <div class="badge-exclusive">EXCLUSIVO</div>
            <h1>${options.heroTitle || options.title || 'A Solução Definitiva Para Seu Problema!'}</h1>
            <p class="hero-subtitle">${options.heroSubtitle || options.description || 'Descubra como nosso produto revolucionário pode transformar sua vida em apenas 30 dias ou seu dinheiro de volta!'}</p>
            
            <div class="hero-features">
              <div class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Resultados comprovados</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Garantia de 30 dias</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Suporte exclusivo</span>
                    </div>
                </div>
            
            <a href="#cta" class="btn btn-cta-primary">QUERO GARANTIR O MEU <span class="arrow-right">→</span></a>
            
            <div class="security-badges">
              <span class="security-badge">🔒 Compra Segura</span>
              <span class="security-badge">✓ Satisfação Garantida</span>
            </div>
          </div>
          <div class="hero-image">
            <div class="product-image-container">
              <div class="product-image-placeholder">
                <span>IMAGEM DO PRODUTO</span>
              </div>
              <div class="discount-badge">50% OFF</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

    <section class="countdown-section">
                <div class="container">
        <div class="countdown-container">
          <p class="countdown-title">OFERTA TERMINA EM:</p>
          <div class="countdown-timer" id="countdown">
            <div class="countdown-item">
              <span class="countdown-number" id="countdown-hours">23</span>
              <span class="countdown-label">Horas</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-number" id="countdown-minutes">59</span>
              <span class="countdown-label">Minutos</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-number" id="countdown-seconds">59</span>
              <span class="countdown-label">Segundos</span>
            </div>
                        </div>
                    </div>
                </div>
            </section>

    <section id="benefits" class="section benefits-section">
                <div class="container">
        <h2 class="section-title">BENEFÍCIOS EXCLUSIVOS</h2>
        <p class="section-subtitle">Veja por que milhares de pessoas já escolheram nossa solução</p>
        
        <div class="benefits-grid">
          ${options.benefits.map((benefit, index) => `
            <div class="benefit-card">
              <div class="benefit-icon">
                <span>${index + 1}</span>
              </div>
              <div class="benefit-content">
                <h3>${benefit}</h3>
                <p>Descubra como este benefício exclusivo vai transformar sua experiência e trazer resultados surpreendentes.</p>
              </div>
            </div>
          `).join('')}
                        </div>
                        
        <div class="mid-page-cta">
          <a href="#cta" class="btn btn-cta-secondary">QUERO ESSES BENEFÍCIOS AGORA</a>
        </div>
      </div>
    </section>

    <section class="guarantee-section">
      <div class="container">
        <div class="guarantee-container">
          <div class="guarantee-seal"></div>
          <div class="guarantee-content">
            <h2>GARANTIA INCONDICIONAL DE 30 DIAS</h2>
            <p>Experimente nosso produto por 30 dias. Se não ficar 100% satisfeito, devolvemos seu dinheiro integralmente, sem perguntas.</p>
                        </div>
                    </div>
                </div>
            </section>

    ${options.testimonials ? `
    <section id="testimonials" class="section testimonials-section">
      <div class="container">
        <h2 class="section-title">CLIENTES SATISFEITOS</h2>
        <p class="section-subtitle">Veja o que estão dizendo sobre nossos resultados</p>
        
        <div class="testimonials-grid">
          ${options.testimonials.map(testimonial => `
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <div class="testimonial-content">
                <p>"${testimonial.text}"</p>
              </div>
              <div class="testimonial-author">
                <div class="testimonial-author-info">
                  <h4>${testimonial.name}</h4>
                  <p>${testimonial.role}</p>
                </div>
              </div>
              <div class="testimonial-result">
                <span class="result-label">Resultado:</span>
                <span class="result-value">Transformação em 30 dias</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <section id="faq" class="section faq-section">
                <div class="container">
        <h2 class="section-title">PERGUNTAS FREQUENTES</h2>
        <div class="faq-container">
          <div class="faq-item">
            <div class="faq-question">
              <h3>Como funciona o produto?</h3>
              <span class="faq-toggle">+</span>
            </div>
            <div class="faq-answer">
              <p>Nosso produto utiliza tecnologia inovadora que proporciona resultados rápidos e eficientes. O processo é simples e você verá resultados em poucos dias de uso.</p>
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question">
              <h3>Quanto tempo leva para ver resultados?</h3>
              <span class="faq-toggle">+</span>
            </div>
            <div class="faq-answer">
              <p>A maioria dos nossos clientes começa a ver resultados significativos em apenas 14 dias de uso contínuo.</p>
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question">
              <h3>A garantia é realmente sem complicações?</h3>
              <span class="faq-toggle">+</span>
            </div>
            <div class="faq-answer">
              <p>Sim! Se você não ficar completamente satisfeito nos primeiros 30 dias, basta nos contatar para um reembolso total, sem perguntas.</p>
            </div>
          </div>
        </div>
                        </div>
    </section>

    <section id="cta" class="section cta-section">
      <div class="container">
        <div class="cta-card">
          <div class="price-container">
            <div class="price-tag">
              <div class="price-original">De <span>R$${Number(options.pricing || '997').toFixed(2)}</span></div>
              <div class="price-current">Por apenas <span>R$${(Number(options.pricing || '997') * 0.5).toFixed(2)}</span></div>
              <div class="price-installment">ou até 12x de <span>R$${(Number(options.pricing || '997') * 0.5 / 12).toFixed(2)}</span></div>
            </div>
            <div class="discount-tag">50% OFF</div>
                                </div>
                                
          <h2 class="cta-title">GARANTA SUA OFERTA EXCLUSIVA</h2>
          <p class="cta-subtitle">Junte-se a milhares de clientes satisfeitos e transforme sua vida hoje mesmo!</p>
          
          <a href="#" class="btn btn-cta-main">QUERO APROVEITAR ESTA OFERTA AGORA!</a>
          
          <div class="cta-features">
            <div class="cta-feature">
              <span class="feature-icon">✓</span>
              <span>Envio imediato</span>
            </div>
            <div class="cta-feature">
              <span class="feature-icon">✓</span>
              <span>Garantia de 30 dias</span>
            </div>
            <div class="cta-feature">
              <span class="feature-icon">✓</span>
              <span>Suporte prioritário</span>
            </div>
            <div class="cta-feature">
              <span class="feature-icon">✓</span>
              <span>Bônus exclusivos</span>
            </div>
                                </div>
                                
          <div class="payment-methods">
            <span class="payment-label">FORMAS DE PAGAMENTO:</span>
            <div class="payment-icons">
              <span class="payment-icon">💳</span>
              <span class="payment-icon">💰</span>
              <span class="payment-icon">🏦</span>
            </div>
                                </div>
                                
          <div class="security-notice">
            <span>🔒 Pagamento 100% seguro e criptografado</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>

  <footer class="footer-sales">
            <div class="container">
      <div class="footer-grid">
        <div class="footer-company">
          <a href="#" class="footer-logo">${options.logoText || 'Brand'}</a>
          <p>Oferecendo soluções inovadoras desde 2010.</p>
          <div class="footer-contact">
            <p>Email: ${options.contactEmail || 'contato@empresa.com'}</p>
            <p>Tel: ${options.phoneNumber || '(00) 0000-0000'}</p>
          </div>
                    </div>
        <div class="footer-links">
          <div class="footer-links-column">
            <h3>Links</h3>
            <ul>
              <li><a href="#">Início</a></li>
              <li><a href="#benefits">Benefícios</a></li>
              <li><a href="#testimonials">Depoimentos</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
                    </div>
          <div class="footer-links-column">
            <h3>Políticas</h3>
            <ul>
              <li><a href="#">Termos de Uso</a></li>
              <li><a href="#">Política de Privacidade</a></li>
              <li><a href="#">Política de Cookies</a></li>
              <li><a href="#">Trocas e Devoluções</a></li>
            </ul>
                        </div>
                    </div>
                </div>
      <div class="footer-bottom">
        <p class="copyright">${options.footerText || '© ' + new Date().getFullYear() + ' ' + (options.logoText || 'Brand') + '. Todos os direitos reservados.'}</p>
        <p class="legal-notice">Este site não é afiliado ao Facebook ou a qualquer entidade do Facebook. Depois que você sair do Facebook, a responsabilidade não é deles e sim do nosso site.</p>
                </div>
            </div>
        </footer>

  <div class="urgency-bar">
    <p>⏰ Oferta por tempo limitado! Restam apenas algumas unidades disponíveis!</p>
  </div>
    </body>
</html>
  `;
}

export function getCorporateTemplate(options: TemplateOptions): string {
  // Implementação do template corporativo
  return getBaseTemplate(options);
}

export function getStartupTemplate(options: TemplateOptions): string {
  // Implementação do template startup
  return getBaseTemplate(options);
}

export function getEcommerceTemplate(options: TemplateOptions): string {
  // Implementação do template e-commerce
  return getBaseTemplate(options);
} 