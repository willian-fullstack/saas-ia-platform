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
      tone = 'profissional',
      includeEmojis = true,
      includeHashtags = true,
      quantity = 3
    } = await request.json();

    // Validar os parâmetros necessários
    if (!topic) {
      return NextResponse.json(
        { error: 'O parâmetro "topic" é obrigatório' },
        { status: 400 }
      );
    }

    // Limitar quantidade para evitar tokens excessivos
    const safeQuantity = Math.min(Math.max(parseInt(quantity) || 3, 1), 5);

    // Configurar detalhes de emojis e hashtags
    const emojiPreference = includeEmojis ? 'Inclua emojis relevantes e criativos ao longo do texto.' : 'Não inclua emojis na legenda.';
    const hashtagPreference = includeHashtags ? 'Adicione 5-8 hashtags relevantes ao final da legenda.' : 'Não inclua hashtags na legenda.';

    // Construir o prompt
    const prompt = `
    Crie ${safeQuantity} legendas atraentes e persuasivas para uma postagem sobre "${topic}" no ${platform}.
    
    As legendas devem ter um tom ${tone} e serem otimizadas para:
    - Aumentar o engajamento do público
    - Transmitir a mensagem principal de forma clara e concisa
    - Estimular comentários e compartilhamentos
    - Respeitar as características específicas do ${platform}
    
    ${emojiPreference}
    ${hashtagPreference}
    
    Características específicas para cada legenda:
    1. Uma legenda mais curta e direta (até 150 caracteres)
    2. Uma legenda média com storytelling (até 300 caracteres)
    3. Uma legenda mais elaborada com call-to-action (até 500 caracteres)
    
    Para cada legenda gerada, forneça:
    - A legenda completa, pronta para usar
    - Uma breve explicação sobre por que esta legenda funciona bem no contexto especificado
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em marketing de conteúdo e redação para redes sociais." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.8,
      max_tokens: 1200,
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