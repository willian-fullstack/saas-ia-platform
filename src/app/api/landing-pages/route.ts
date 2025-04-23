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
      // 180 segundos de timeout para cada tentativa
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
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
              content: 'Você é um especialista em design de landing pages, HTML, CSS e copywriting de alta conversão. Seu objetivo é criar landing pages completas e profissionais com código moderno e responsivo. Seja conciso e eficiente na geração, focando em código limpo e otimizado.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5, // Reduzindo para respostas mais consistentes
          max_tokens: 3500, // Reduzindo para respostas mais rápidas
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

export async function POST(request: Request) {
  const startTime = performance.now();
  
  try {
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
        { error: 'Os parâmetros "niche" e "product" são obrigatórios' },
        { status: 400 }
      );
    }

    // Construir instruções sobre as imagens
    let imageInstructions = '';
    if (images && images.length > 0) {
      // Instruções sobre uso direto de imagens
      imageInstructions = `
      INSTRUÇÕES IMPORTANTES PARA IMAGENS:
      
      O usuário forneceu as seguintes imagens (são base64, não se preocupe com o tamanho):
      ${images.map((url: string, index: number) => `- Imagem ${index + 1}: será inserida diretamente no HTML`).join('\n')}
      
      Você deve incluir na sua resposta EXATAMENTE estes marcadores no HTML onde as imagens devem ser inseridas:
      ${images.map((url: string, index: number) => `- Para a imagem ${index + 1}: use <img src="__IMG_${index + 1}__" alt="Imagem do produto ${index + 1}" class="img-fluid">`).join('\n')}
      
      Estes marcadores serão substituídos pelo sistema automaticamente pelas imagens reais.
      Coloque cada imagem em um local estratégico (hero section, seção de benefícios, galeria, etc.).
      `;
    } else {
      imageInstructions = `
      Como não foram fornecidas imagens pelo usuário, use URLs de imagens de placeholder:
      - https://placehold.co/600x400/png
      - https://via.placeholder.com/800x600
      `;
    }

    // Construir o prompt para o modelo - simplificado para reduzir o tempo de resposta
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
    8. Mantenha o código limpo e bem estruturado, mas sucinto
    `;

    // Realizar a chamada para a API DeepSeek
    let result = await callDeepSeekAPI(prompt);

    // Substituir os marcadores de imagem pelos dados base64 das imagens
    if (images && images.length > 0) {
      images.forEach((imageBase64: string, index: number) => {
        const placeholder = `__IMG_${index + 1}__`;
        result = result.replace(
          new RegExp(placeholder, 'g'), 
          imageBase64
        );
      });
    }

    const endTime = performance.now();
    console.log(`api_landing_pages_total: ${(endTime - startTime).toFixed(5)}ms`);

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 