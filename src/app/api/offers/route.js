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
      productName,
      productDescription,
      targetAudience,
      pricePoint,
      bonusCount = 3,
      painPoints = [],
      includeDiscount = true,
      includeUrgency = true,
      contentType = 'completo'
    } = await request.json();

    // Validar os parâmetros necessários
    if (!niche || !productName || !productDescription) {
      return NextResponse.json(
        { error: 'Os parâmetros "niche", "productName" e "productDescription" são obrigatórios' },
        { status: 400 }
      );
    }

    // Limitar quantidade de bônus
    const safeBonusCount = Math.min(Math.max(parseInt(bonusCount) || 3, 1), 7);

    // Construir o prompt para o modelo
    const prompt = `
    Você é um especialista em criação de ofertas persuasivas e irresistíveis.
    
    Crie uma oferta completa para o seguinte produto:
    
    - Nicho: ${niche}
    - Nome do produto: ${productName}
    - Descrição: ${productDescription}
    - Público-alvo: ${targetAudience || 'Pessoas interessadas no nicho'}
    - Faixa de preço: ${pricePoint || 'Médio-alto'}
    
    Dores/problemas do público-alvo:
    ${painPoints.length > 0 
      ? painPoints.map(pain => `- ${pain}`).join('\n') 
      : '- Identifique 3-5 dores principais baseadas no nicho e produto'}
    
    A oferta deve incluir:
    
    1. Headline principal poderosa e cativante
    2. Descrição persuasiva do produto principal
    3. ${safeBonusCount} bônus irresistíveis que complementam o produto principal
    4. Stack de valor (valor percebido de cada item)
    ${includeDiscount ? '5. Desconto irresistível com justificativa' : ''}
    ${includeUrgency ? '6. Elemento de escassez/urgência (tempo limitado, vagas limitadas, etc.)' : ''}
    7. Garantia clara e convincente
    8. Call-to-action persuasivo
    
    ${contentType === 'completo' 
      ? 'Forneça a oferta completa estruturada, incluindo textos para cada seção, valores sugeridos e justificativas.' 
      : 'Forneça um resumo dos principais elementos da oferta em forma de tópicos.'}
    
    Use técnicas de copywriting persuasivo, focando nos benefícios, transformação e resolução de problemas.
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em copywriting, criação de ofertas e marketing de produtos digitais." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
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