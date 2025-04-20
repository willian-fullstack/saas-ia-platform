import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { 
      topic, 
      platform = 'Instagram',
      quantity = 30
    } = await request.json();

    // Validar os parâmetros necessários
    if (!topic) {
      return NextResponse.json(
        { error: 'O parâmetro "topic" é obrigatório' },
        { status: 400 }
      );
    }

    // Limitar quantidade para evitar tokens excessivos
    const safeQuantity = Math.min(Math.max(parseInt(quantity) || 30, 10), 100);

    // Construir o prompt
    const prompt = `
    Gere ${safeQuantity} hashtags relevantes e estratégicas para um conteúdo sobre "${topic}" para ser postado no ${platform}.
    
    Considere:
    - Misture hashtags populares (com alto volume de busca)
    - Inclua hashtags de nicho (mais específicas, com menos competição)
    - Adicione algumas hashtags de comunidade (que conectam pessoas com interesses similares)
    - Inclua hashtags de localização quando relevante
    
    Agrupe as hashtags nas seguintes categorias:
    1. Hashtags populares (amplo alcance)
    2. Hashtags de nicho (audiência específica)
    3. Hashtags de comunidade (engajamento)
    4. Hashtags de tendência (quando aplicável)
    
    Para cada categoria, forneça:
    - As hashtags recomendadas
    - Uma breve explicação sobre por que estas hashtags são eficazes nesta categoria
    
    Por fim, forneça um bloco final com todas as hashtags juntas em formato copiável (sem categorização),
    para facilitar o uso pelo usuário.
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em marketing digital e estratégia de hashtags para redes sociais." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.7,
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