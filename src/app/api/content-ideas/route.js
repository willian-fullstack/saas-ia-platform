import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Função para inicializar o cliente OpenAI
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build-time',
  });
};

export async function POST(request) {
  try {
    const { 
      topic, 
      platform = 'Instagram',
      contentType = 'post',
      quantity = 5,
      audience = '',
      niche = ''
    } = await request.json();

    // Validar os parâmetros necessários
    if (!topic) {
      return NextResponse.json(
        { error: 'O parâmetro "topic" é obrigatório' },
        { status: 400 }
      );
    }

    // Limitar quantidade para evitar tokens excessivos
    const safeQuantity = Math.min(Math.max(parseInt(quantity) || 5, 1), 10);

    // Construir detalhes sobre audiência e nicho
    const audienceDetails = audience ? `A audiência-alvo é: ${audience}.` : '';
    const nicheDetails = niche ? `O nicho de mercado é: ${niche}.` : '';

    // Construir o prompt
    const prompt = `
    Gere ${safeQuantity} ideias inovadoras e criativas de conteúdo sobre "${topic}" para publicação no ${platform} como ${contentType}.
    
    ${audienceDetails}
    ${nicheDetails}
    
    Para cada ideia, forneça:
    1. Um título atraente
    2. Uma breve descrição do conteúdo (1-2 parágrafos)
    3. Motivo pelo qual essa ideia funcionará bem no ${platform}
    4. De 2 a 3 hashtags relevantes
    
    As ideias devem ser:
    - Originais e diferenciadas entre si
    - Relevantes para o tópico solicitado
    - Otimizadas para engajamento no ${platform}
    - Viáveis de implementar
    - Adequadas para o tipo de conteúdo (${contentType})
    
    Enumere claramente cada ideia com números (1, 2, 3...).
    `;

    // Inicializar o cliente OpenAI
    const openai = getOpenAIClient();

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em estratégia de conteúdo e marketing digital." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.9,
      max_tokens: 1500,
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