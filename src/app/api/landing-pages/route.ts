import { NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';

// Função para enviar requisição para a API do DeepSeek
async function callDeepSeekAPI(prompt: string) {
  const startTime = performance.now();
  const maxRetries = 2;
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Loop de retentativas
  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      // 240 segundos de timeout para cada tentativa
      const timeoutId = setTimeout(() => controller.abort(), 240000);
      
      console.log(`Tentativa ${retryCount + 1} de chamar a API DeepSeek`);
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: `Você é um designer web especializado em landing pages premium de alta conversão com mais de 15 anos de experiência.
              
Sua missão é criar landing pages COMPLETAS E VISUALMENTE IMPRESSIONANTES com:
- Design moderno e profissional com cores vibrantes e elementos visuais atraentes
- Uso estratégico de gradientes, espaçamento e tipografia de alto impacto
- Animações sutis para engajamento usando AOS (Animate On Scroll)
- Elementos gráficos, ícones e ilustrações em posições estratégicas
- Layout estruturado em seções bem definidas e CLARAMENTE IDENTIFICADAS com IDs
- Uso extensivo de Bootstrap 5 para componentes ricos (carrosséis, cards, acordeões)
- Gradientes modernos, sombras e efeitos visuais para profundidade
- Interface que comunica profissionalismo e confiança
- Seções interativas que destacam os principais benefícios
- Call-to-actions impactantes e visualmente destacados
- Elementos de prova social (depoimentos, logos de clientes, contadores)

IMPORTANTE: Sua entrega será imediatamente rejeitada se NÃO incluir TODAS as seções essenciais abaixo:
1. Cabeçalho (<header>) com menu de navegação completo
2. Hero section impactante com título claro e CTA principal
3. Seção de benefícios/recursos com 3-5 cards ou itens visualmente atrativos
4. Seção de depoimentos com pelo menos 3 depoimentos (indicada com id="depoimentos" ou id="testimonials")
5. Seção FAQ com pelo menos 3-5 perguntas usando accordions (indicada com id="faq")
6. Seção CTA final para conversão
7. Rodapé (<footer>) completo com links de navegação, contato e copyright

Sobre imagens e recursos:
- Imagens fornecidas pelo usuário devem ser marcadas como src="__IMG_X__" (substitua X pelo número)
- Se o usuário não fornecer imagens suficientes, use URLs de imagens de stock gratuitas
- Nunca deixe placeholders como "Mídia X" diretamente no código HTML

Requisitos técnicos obrigatórios:
- Use Bootstrap 5 para componentes e layout responsivo
- Adicione FontAwesome para ícones (use de 10-15 ícones na página)
- Inclua AOS (Animate on Scroll) com efeitos de animação em pelo menos 5 elementos
- Adicione JavaScript para validação de formulários, toggles, etc.
- Certifique-se de que todos os links e botões tenham estados hover
- Use gradientes modernos em pelo menos 2-3 elementos
- Garanta design totalmente responsivo para mobile e desktop

Forneça um código HTML completo e pronto para uso, incluindo todos os estilos CSS embutidos (na tag <style>) e scripts necessários.` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4500,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API DeepSeek: ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      console.log(`deepseek_landingpage_api_call: ${(endTime - startTime).toFixed(3)}ms`);
      
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
        throw new Error('Tempo limite excedido na API DeepSeek');
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

// Função para garantir que o HTML esteja completo e bem estruturado
function sanitizeAndCompleteHTML(html: string): string {
  // Verificar se o HTML tem doctype e tags básicas
  let sanitizedHtml = html.trim();
  
  // Verificar e adicionar doctype se necessário
  if (!sanitizedHtml.toLowerCase().includes('<!doctype')) {
    sanitizedHtml = '<!DOCTYPE html>\n' + sanitizedHtml;
  }
  
  // Verificar e adicionar tag html se necessário
  if (!sanitizedHtml.toLowerCase().includes('<html')) {
    sanitizedHtml = sanitizedHtml.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="pt-BR">');
    // Adicionar o fechamento da tag html no final, se necessário
    if (!sanitizedHtml.toLowerCase().includes('</html>')) {
      sanitizedHtml += '\n</html>';
    }
  }
  
  // Verificar e adicionar tags head e body se necessário
  if (!sanitizedHtml.toLowerCase().includes('<head')) {
    sanitizedHtml = sanitizedHtml.replace('<html lang="pt-BR">', '<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Landing Page</title>\n</head>');
  }
  
  if (!sanitizedHtml.toLowerCase().includes('<body')) {
    const headEndIndex = sanitizedHtml.toLowerCase().indexOf('</head>') + 7;
    sanitizedHtml = sanitizedHtml.substring(0, headEndIndex) + '\n<body>\n' + sanitizedHtml.substring(headEndIndex);
  }
  
  if (!sanitizedHtml.toLowerCase().includes('</body>')) {
    const htmlEndIndex = sanitizedHtml.toLowerCase().indexOf('</html>');
    if (htmlEndIndex !== -1) {
      sanitizedHtml = sanitizedHtml.substring(0, htmlEndIndex) + '\n</body>\n' + sanitizedHtml.substring(htmlEndIndex);
    } else {
      sanitizedHtml += '\n</body>';
    }
  }
  
  // Garantir que as bibliotecas essenciais estejam incluídas
  const headEndIndex = sanitizedHtml.toLowerCase().indexOf('</head>');
  if (headEndIndex !== -1) {
    let headContent = sanitizedHtml.substring(0, headEndIndex);
    
    // Adicionar Bootstrap se não existir
    if (!headContent.includes('bootstrap')) {
      headContent += '\n<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    }
    
    // Adicionar Font Awesome se não existir
    if (!headContent.includes('font-awesome') && !headContent.includes('fontawesome')) {
      headContent += '\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';
    }
    
    // Adicionar AOS (Animate on Scroll) se não existir
    if (!headContent.includes('aos')) {
      headContent += '\n<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">';
    }
    
    // Adicionar Google Fonts - Roboto e Montserrat
    if (!headContent.includes('fonts.googleapis.com')) {
      headContent += '\n<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">';
    }
    
    sanitizedHtml = headContent + '</head>' + sanitizedHtml.substring(headEndIndex + 7);
  }
  
  // Adicionar scripts no final do corpo se necessário
  const bodyEndIndex = sanitizedHtml.toLowerCase().indexOf('</body>');
  if (bodyEndIndex !== -1) {
    let scriptContent = '';
    
    // Adicionar Bootstrap JS se não existir
    if (!sanitizedHtml.includes('bootstrap.bundle.min.js')) {
      scriptContent += '\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>';
    }
    
    // Adicionar jQuery se não existir e for necessário
    if ((!sanitizedHtml.includes('jquery') || !sanitizedHtml.includes('jquery.min.js')) && 
        (sanitizedHtml.includes('$(') || sanitizedHtml.includes('jQuery'))) {
      scriptContent += '\n<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>';
    }
    
    // Adicionar AOS JS se não existir
    if (!sanitizedHtml.includes('aos.js')) {
      scriptContent += '\n<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>';
      scriptContent += '\n<script>AOS.init();</script>';
    }
    
    if (scriptContent) {
      sanitizedHtml = sanitizedHtml.substring(0, bodyEndIndex) + scriptContent + sanitizedHtml.substring(bodyEndIndex);
    }
  }
  
  // Verificar se há scripts que possam estar causando problemas e corrigir
  sanitizedHtml = sanitizedHtml.replace(/<script>([\s\S]*?)<\/script>/g, (match, content) => {
    // Se o script contiver document.write, remova ou substitua
    if (content.includes('document.write')) {
      return '<!-- Script com document.write removido para evitar problemas -->';
    }
    return match;
  });
  
  // Corrigir placeholders de mídia que podem estar sendo usados incorretamente
  sanitizedHtml = sanitizedHtml.replace(/src="Mídia (\d+)"/gi, (match, num) => {
    return `src="__IMG_${num}__" alt="Imagem do produto ${num}" class="img-fluid"`;
  });
  
  // Verificar e adicionar seções essenciais que podem estar faltando
  const bodyContent = sanitizedHtml.toLowerCase();
  
  // Verificar se existe um rodapé
  if (!bodyContent.includes('<footer') && bodyEndIndex !== -1) {
    const footerHTML = `
    <footer class="bg-dark text-white py-4 mt-5">
      <div class="container">
        <div class="row">
          <div class="col-md-4 mb-3">
            <h5>Sobre Nós</h5>
            <p class="text-muted">Somos uma empresa comprometida com a excelência e qualidade em todos os nossos produtos e serviços.</p>
          </div>
          <div class="col-md-4 mb-3">
            <h5>Links Rápidos</h5>
            <ul class="list-unstyled">
              <li><a href="#" class="text-decoration-none text-light">Início</a></li>
              <li><a href="#beneficios" class="text-decoration-none text-light">Benefícios</a></li>
              <li><a href="#depoimentos" class="text-decoration-none text-light">Depoimentos</a></li>
              <li><a href="#contato" class="text-decoration-none text-light">Contato</a></li>
            </ul>
          </div>
          <div class="col-md-4 mb-3">
            <h5>Contato</h5>
            <ul class="list-unstyled text-muted">
              <li><i class="fas fa-envelope me-2"></i> contato@empresa.com</li>
              <li><i class="fas fa-phone me-2"></i> (11) 9999-9999</li>
              <li><i class="fas fa-map-marker-alt me-2"></i> São Paulo, SP</li>
            </ul>
            <div class="mt-3">
              <a href="#" class="text-light me-2"><i class="fab fa-facebook fa-lg"></i></a>
              <a href="#" class="text-light me-2"><i class="fab fa-instagram fa-lg"></i></a>
              <a href="#" class="text-light me-2"><i class="fab fa-linkedin fa-lg"></i></a>
              <a href="#" class="text-light"><i class="fab fa-whatsapp fa-lg"></i></a>
            </div>
          </div>
        </div>
        <div class="text-center mt-4">
          <p class="mb-0">&copy; ${new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
    `;
    sanitizedHtml = sanitizedHtml.substring(0, bodyEndIndex) + footerHTML + sanitizedHtml.substring(bodyEndIndex);
  }
  
  // Verificar se existe uma seção de depoimentos
  if (!bodyContent.includes('depoimentos') && !bodyContent.includes('testimonials') && bodyEndIndex !== -1) {
    // Encontrar um bom local para inserir os depoimentos (antes do rodapé ou no final do conteúdo)
    const footerIndex = sanitizedHtml.toLowerCase().indexOf('<footer');
    const insertPosition = footerIndex !== -1 ? footerIndex : bodyEndIndex;
    
    const depoimentosHTML = `
    <section id="depoimentos" class="py-5 bg-light">
      <div class="container">
        <h2 class="text-center mb-5">O que nossos clientes dizem</h2>
        <div class="row">
          <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="100">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center me-3" style="width:50px;height:50px">
                    <i class="fas fa-user"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">Carlos Silva</h5>
                    <small class="text-muted">Cliente desde 2021</small>
                  </div>
                </div>
                <div class="text-warning mb-2">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </div>
                <p class="card-text">"Este produto superou todas as minhas expectativas. A qualidade é excepcional e o atendimento ao cliente é impecável. Recomendo fortemente!"</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="200">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="bg-success rounded-circle text-white d-flex align-items-center justify-content-center me-3" style="width:50px;height:50px">
                    <i class="fas fa-user"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">Maria Oliveira</h5>
                    <small class="text-muted">Cliente desde 2022</small>
                  </div>
                </div>
                <div class="text-warning mb-2">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star-half-alt"></i>
                </div>
                <p class="card-text">"Estou impressionada com os resultados obtidos. Já testei vários produtos similares no mercado, mas este é de longe o melhor. Vale cada centavo investido!"</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="300">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="bg-info rounded-circle text-white d-flex align-items-center justify-content-center me-3" style="width:50px;height:50px">
                    <i class="fas fa-user"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">Pedro Santos</h5>
                    <small class="text-muted">Cliente desde 2020</small>
                  </div>
                </div>
                <div class="text-warning mb-2">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </div>
                <p class="card-text">"Melhor investimento que fiz para meu negócio. Os resultados apareceram rapidamente e o suporte técnico está sempre disponível para ajudar. Recomendo!"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
    
    sanitizedHtml = sanitizedHtml.substring(0, insertPosition) + depoimentosHTML + sanitizedHtml.substring(insertPosition);
  }
  
  // Verificar se existe uma seção de FAQ
  if (!bodyContent.includes('faq') && !bodyContent.includes('perguntas') && bodyEndIndex !== -1) {
    const footerIndex = sanitizedHtml.toLowerCase().indexOf('<footer');
    const insertPosition = footerIndex !== -1 ? footerIndex : bodyEndIndex;
    
    const faqHTML = `
    <section id="faq" class="py-5">
      <div class="container">
        <h2 class="text-center mb-5">Perguntas Frequentes</h2>
        <div class="accordion" id="accordionFaq">
          <div class="accordion-item" data-aos="fade-up" data-aos-delay="100">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1">
                Quanto tempo leva para ver resultados?
              </button>
            </h2>
            <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#accordionFaq">
              <div class="accordion-body">
                A maioria dos nossos clientes começa a ver resultados nas primeiras semanas de uso. No entanto, os resultados podem variar de pessoa para pessoa, dependendo de vários fatores individuais.
              </div>
            </div>
          </div>
          <div class="accordion-item" data-aos="fade-up" data-aos-delay="200">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2">
                Existe garantia de satisfação?
              </button>
            </h2>
            <div id="collapse2" class="accordion-collapse collapse" data-bs-parent="#accordionFaq">
              <div class="accordion-body">
                Sim! Oferecemos garantia de 30 dias. Se você não estiver satisfeito com o produto/serviço, pode solicitar reembolso total dentro deste período.
              </div>
            </div>
          </div>
          <div class="accordion-item" data-aos="fade-up" data-aos-delay="300">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3">
                Como funciona o suporte ao cliente?
              </button>
            </h2>
            <div id="collapse3" class="accordion-collapse collapse" data-bs-parent="#accordionFaq">
              <div class="accordion-body">
                Nossa equipe de suporte está disponível de segunda a sexta, das 8h às 18h, por telefone, e-mail ou chat. Nos finais de semana, oferecemos suporte por e-mail com resposta em até 24 horas.
              </div>
            </div>
          </div>
          <div class="accordion-item" data-aos="fade-up" data-aos-delay="400">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4">
                Quais formas de pagamento são aceitas?
              </button>
            </h2>
            <div id="collapse4" class="accordion-collapse collapse" data-bs-parent="#accordionFaq">
              <div class="accordion-body">
                Aceitamos cartões de crédito, boleto bancário, PIX e transferência bancária. Oferecemos também opções de parcelamento em até 12 vezes no cartão.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
    
    sanitizedHtml = sanitizedHtml.substring(0, insertPosition) + faqHTML + sanitizedHtml.substring(insertPosition);
  }
  
  return sanitizedHtml;
}

/**
 * Função que constrói o prompt para gerar a landing page
 */
function buildLandingPagePrompt(formData: any, images: any[]): string {
  // Extrair informações do formulário
  const {
    titulo,
    objetivo,
    descricao,
    tom,
    cta,
    elementos,
    cores,
    estilo
  } = formData;

  // Construir a descrição das imagens
  const imageDescriptions = images.map((img, index) => 
    `Mídia ${index + 1}: ${img.description || `Imagem ${index + 1}`}`
  ).join('\n');

  return `
Crie uma landing page completa e moderna para o seguinte produto/serviço:

TÍTULO: ${titulo}

OBJETIVO: ${objetivo}

DESCRIÇÃO DETALHADA: ${descricao}

TOM DE COMUNICAÇÃO: ${tom}

CALL-TO-ACTION PRINCIPAL: ${cta}

ELEMENTOS A INCLUIR: ${elementos || "Cabeçalho, Seção principal, Benefícios, Depoimentos, Formulário de contato, Rodapé, FAQ, Hero section"}

CORES PRINCIPAIS: ${cores || "Use cores modernas que combinem com o nicho e objetivo"}

ESTILO VISUAL: ${estilo}

IMAGENS DISPONÍVEIS:
${imageDescriptions || "Não há imagens disponíveis. Use placeholders adequados."}

Crie uma landing page HTML5 completa, moderna e responsiva com todos os elementos necessários. 
A página DEVE incluir:
- Cabeçalho com logo e menu de navegação
- Seção hero com título impactante e CTA principal
- Seção de benefícios/recursos em formato visual atraente
- Seção de depoimentos com pelo menos 3 depoimentos fictícios
- Seção "Sobre nós" ou informativa sobre a empresa/serviço
- Seção de preços/planos (se aplicável)
- Formulário de contato ou captura de leads
- Seção FAQ com pelo menos 3 perguntas comuns
- Rodapé completo com links de navegação, contato e redes sociais
- Design totalmente responsivo para celulares, tablets e desktop

Incorpore as imagens disponíveis nos locais mais adequados usando os marcadores 'Mídia X' 
como src das tags img. Por exemplo: <img src="Mídia 1" alt="Descrição">

IMPORTANTE: Gere HTML válido e semântico com CSS embutido no próprio arquivo. O código deve ser completo,
funcionando imediatamente quando o arquivo for aberto.

Inclua JavaScript para funcionalidades extras como animações, validação de formulário e experiência interativa.
NÃO use frameworks externos, todo o código deve estar contido no único arquivo HTML.
`;
}

/**
 * Função que retorna as instruções do sistema para a API
 */
function getSystemInstructions(): { role: string, content: string } {
  return {
    role: "system",
    content: `Você é um especialista em desenvolvimento web focado em landing pages de alta conversão.
Seu trabalho é criar código HTML, CSS e JavaScript 100% funcional para páginas completas.

Regras importantes:
1. Gere APENAS código HTML válido, sem explicações, comentários ou markdown.
2. Inclua todo o CSS no arquivo com a tag <style>.
3. Inclua todo o JavaScript no arquivo com a tag <script>.
4. Crie páginas 100% responsivas que funcionem bem em celulares, tablets e desktops.
5. Inclua designs para estados de hover em botões e links.
6. Utilize HTML semântico (header, nav, main, section, footer, etc).
7. Garanta que todos os forms tenham validação básica com JavaScript.
8. Inclua animações sutis com CSS para melhorar a experiência.
9. Adicione microtextos e conteúdo relevante, não apenas lorem ipsum.
10. Os elementos visuais devem seguir as melhores práticas de UX e UI.
11. Incorpore imagens nos locais adequados usando os marcadores "Mídia X".
12. Inclua SEMPRE seções de benefícios, depoimentos e FAQ, mesmo que não solicitado explicitamente.
13. Adicione rodapé completo com política de privacidade, termos, contato e redes sociais.
14. Use ícones e elementos visuais para melhorar a aparência.
15. Inclua sempre uma opção de contato ou captura de leads.
16. Não use bibliotecas externas como jQuery, Bootstrap, etc.

O código deve funcionar perfeitamente quando o arquivo HTML for aberto num navegador moderno.`
  };
}

/**
 * Função para limpar o HTML antes de enviar para o cliente
 */
function sanitizeHTML(html: string): string {
  // Remover comentários desnecessários
  const cleanedHtml = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  
  return cleanedHtml;
}

export async function POST(request: Request) {
  const startTime = performance.now();
  
  try {
    // Parse dados do formulário 
    const formData = await request.json();
    const { titulo, objetivo, descricao, tom, cta, elementos, cores, estilo, images } = formData;
    
    console.log("Recebido pedido de landing page:", { titulo, objetivo });
    console.log(`${images?.length || 0} imagens recebidas`);
    
    // Obter o token da API DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("API key não configurada.");
    }
    
    // Construir o prompt para a API
    const prompt = `
Crie uma landing page completa e moderna para o seguinte produto/serviço:

TÍTULO: ${titulo || ""}

OBJETIVO: ${objetivo || ""}

DESCRIÇÃO DETALHADA: ${descricao || ""}

TOM DE COMUNICAÇÃO: ${tom || "profissional"}

CALL-TO-ACTION PRINCIPAL: ${cta || ""}

ELEMENTOS A INCLUIR: ${elementos || "Cabeçalho, Hero section, Benefícios, Funcionalidades, Depoimentos, FAQ, Formulário de contato, Rodapé"}

CORES PRINCIPAIS: ${cores || "Use cores modernas que combinem com o objetivo do produto/serviço"}

ESTILO VISUAL: ${estilo || "moderno"}

IMAGENS DISPONÍVEIS:
${images?.map((img: any, index: number) => `Mídia ${index + 1}: ${img.description || `Imagem ${index + 1}`}`).join('\n') || "Não há imagens disponíveis. Use placeholders adequados."}

Crie uma landing page HTML5 completa, moderna e responsiva com todos os elementos necessários.
A página DEVE incluir:
- Cabeçalho com logo e menu de navegação
- Seção hero com título impactante e CTA principal
- Seção de benefícios/recursos em formato visual atraente (pelo menos 3-4 benefícios)
- Seção de depoimentos com pelo menos 3 depoimentos fictícios
- Seção "Sobre nós" ou informativa sobre a empresa/serviço
- Seção de preços/planos (se aplicável)
- Formulário de contato ou captura de leads funcionais
- Seção FAQ com pelo menos 4-5 perguntas comuns
- Rodapé completo com links de navegação, contato e redes sociais
- Design totalmente responsivo para celulares, tablets e desktop

Use as imagens disponíveis nos locais mais adequados usando: <img src="Mídia X" alt="Descrição">
Por exemplo: <img src="Mídia 1" alt="Imagem principal do produto">

IMPORTANTE:
- Use Bootstrap 5 para componentes e layout responsivo
- Adicione efeitos de animação AOS (Animate On Scroll)
- Use FontAwesome para ícones
- Adicione estilos CSS personalizados para criar uma aparência única e profissional
- Inclua JavaScript para interações como validação de formulários, sliders, etc.
- Certifique-se de que todos os links e botões tenham efeitos de hover
- Use gradientes, sombras e efeitos visuais modernos

Gere um código HTML completo e pronto para uso, incluindo todos os estilos CSS e scripts JavaScript necessários.`;

    // Chamar a API DeepSeek
    const result = await callDeepSeekAPI(prompt);
    
    // Sanitizar e completar o HTML gerado
    const sanitizedHtml = sanitizeAndCompleteHTML(result);
    
    // Capturar tempo total de processamento
    const endTime = performance.now();
    const timeElapsed = (endTime - startTime) / 1000; // em segundos
    
    console.log(`Landing page gerada em ${timeElapsed.toFixed(2)} segundos`);
    
    // Retornar o HTML da landing page
    return NextResponse.json({ 
      result: sanitizedHtml,
      processingTime: timeElapsed.toFixed(2)
    });
    
  } catch (error: any) {
    console.error("Erro ao gerar landing page:", error);
    
    // Capturar tempo total mesmo em caso de erro
    const endTime = performance.now();
    const timeElapsed = (endTime - startTime) / 1000; // em segundos
    
    return NextResponse.json(
      { 
        error: error.message || "Erro ao gerar a landing page", 
        processingTime: timeElapsed.toFixed(2)
      }, 
      { status: 500 }
    );
  }
} 