import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { niche, emotion, details } = await request.json();

    // Validar os parâmetros necessários
    if (!niche || !emotion) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: niche, emotion' },
        { status: 400 }
      );
    }

    // Construir o prompt para o modelo
    const prompt = `
    Você é um copywriter profissional especialista em marketing persuasivo.
    
    Crie um texto de venda persuasivo para o nicho: ${niche}.
    
    Use tom emocional: ${emotion}.
    
    Detalhes adicionais: ${details || 'N/A'}
    
    Estruture o texto com:
    1. Título chamativo
    2. Subtítulo que complementa o título
    3. Introdução que estabelece o problema
    4. Corpo do texto explicando a solução
    5. Pelo menos 3 bullets de benefícios
    6. Call-to-action final convincente
    
    Formato de saída:
    # Título
    ## Subtítulo
    
    Introdução
    
    Corpo do texto
    
    • Benefício 1
    • Benefício 2
    • Benefício 3
    
    CTA
    `;

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { "role": "system", "content": "Você é um copywriter especialista em marketing digital." },
        { "role": "user", "content": prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
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