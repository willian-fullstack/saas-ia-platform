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
      type, 
      platform, 
      duration, 
      keyPoints,
      generateCapCutFormat 
    } = await request.json();

    // Validar os parâmetros necessários
    if (!topic || !platform) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: topic, platform' },
        { status: 400 }
      );
    }

    // Construir o prompt base
    let prompt = `
    Você é um roteirista profissional especializado em vídeos curtos para redes sociais.
    
    Crie um roteiro detalhado para um vídeo sobre: ${topic}
    Plataforma: ${platform}
    Tipo de conteúdo: ${type || 'Informativo'}
    Duração aproximada: ${duration || '30-60 segundos'}
    
    Pontos-chave a incluir:
    ${keyPoints ? keyPoints : 'Defina os pontos principais baseados no tópico'}
    
    O roteiro deve ser:
    1. Cativante desde os primeiros segundos
    2. Direto e objetivo
    3. Otimizado para engajamento na plataforma ${platform}
    4. Estruturado para retenção do espectador
    `;

    // Adicionar instruções para formato CapCut se solicitado
    if (generateCapCutFormat === true) {
      prompt += `
      
      IMPORTANTE: Forneça o roteiro no formato de tabela para CapCut com estas colunas:
      1. Tempo (em segundos)
      2. Visual/Ação
      3. Texto na tela
      4. Áudio/Narração
      
      Exemplo:
      | Tempo | Visual/Ação | Texto na tela | Áudio/Narração |
      | 0-3s | Close no produto | NOVIDADE! | Apresentando a solução que você precisava |
      `;
    } else {
      prompt += `
      
      Formato do roteiro:
      1. Gancho inicial (primeiros 3 segundos)
      2. Introdução ao tema
      3. Desenvolvimento dos pontos principais
      4. Call-to-action final
      
      Para cada seção, especifique:
      - O que mostrar visualmente
      - O que dizer (narração/fala)
      - Textos que devem aparecer na tela
      `;
    }

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em criação de roteiros para vídeos curtos de alto engajamento." 
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