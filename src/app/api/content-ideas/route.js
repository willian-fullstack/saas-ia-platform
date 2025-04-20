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
      platform, 
      contentType, 
      quantity = 5
    } = await request.json();

    // Validar os parâmetros necessários
    if (!niche || !platform) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: niche, platform' },
        { status: 400 }
      );
    }

    // Limitar quantidade para evitar tokens excessivos
    const safeQuantity = Math.min(Math.max(parseInt(quantity) || 5, 1), 20);

    // Construir o prompt
    const prompt = `
    Você é um estrategista de marketing digital especializado em criação de conteúdo.
    
    Gere ${safeQuantity} ideias criativas de conteúdo para:
    
    Nicho/Indústria: ${niche}
    Plataforma: ${platform}
    Tipo de conteúdo: ${contentType || 'variado'}
    
    Para cada ideia, inclua:
    1. Um título cativante
    2. Uma breve descrição do conteúdo (3-4 linhas)
    3. Por que essa ideia funcionaria bem para o público-alvo
    4. Hashtags recomendadas (5-7 hashtags)
    
    Considere as características específicas da plataforma ${platform} e tendências atuais do mercado.
    As ideias devem ser altamente engajadoras, originais e direcionadas para gerar:
    - Mais visibilidade
    - Aumento de seguidores
    - Conversões/vendas
    - Estabelecimento de autoridade no nicho
    
    Formate cada ideia claramente separada das outras, com numeração e subtítulos claros.
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em marketing digital e criação de conteúdo que entende profundamente as nuances de cada plataforma social." 
        },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
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