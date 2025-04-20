import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { 
      niche, 
      product, 
      benefits = [],
      targetAudience,
      callToAction,
      testimonials = false,
      pricing = '',
      style = 'minimalista'
    } = await request.json();

    // Validar os parâmetros necessários
    if (!niche || !product) {
      return NextResponse.json(
        { error: 'Os parâmetros "niche" e "product" são obrigatórios' },
        { status: 400 }
      );
    }

    // Construir o prompt para o modelo
    const prompt = `
    Você é um especialista em criação de landing pages de alta conversão.
    
    Preciso que você crie uma landing page otimizada para:
    
    - Nicho: ${niche}
    - Produto: ${product}
    - Público-alvo: ${targetAudience || 'Pessoas interessadas no nicho'}
    - Call-to-action principal: ${callToAction || 'Comprar agora'}
    - Estilo visual: ${style}
    
    Benefícios do produto:
    ${benefits.length > 0 
      ? benefits.map(benefit => `- ${benefit}`).join('\n') 
      : '- Defina 3-5 benefícios principais baseados no nicho e produto'}
    
    ${pricing ? `Informações de preço/oferta: ${pricing}` : ''}
    ${testimonials ? 'Inclua espaço para depoimentos/social proof' : ''}
    
    Forneça:
    
    1. HTML completo da landing page, bem estruturado, semântico e pronto para uso
    2. CSS embutido ou em uma seção separada
    3. JavaScript (se necessário) para funcionalidades básicas
    
    O design deve ser:
    - Responsivo
    - Otimizado para conversão
    - Clean e profissional
    - Focado em um único objetivo (CTA principal)
    
    Use elementos visuais, espaçamento adequado, e as melhores práticas de copywriting para landing pages.
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em design de landing pages e copywriting de alta conversão." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Extrair e retornar o resultado
    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação', details: error.message },
      { status: 500 }
    );
  }
} 