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
      audience = '',
      platform = 'YouTube',
      duration = 'média',
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

    // Determinar a faixa de duração em minutos
    let durationRange = '';
    switch (duration.toLowerCase()) {
      case 'curta':
        durationRange = 'entre 3-5 minutos';
        break;
      case 'média':
        durationRange = 'entre 7-12 minutos';
        break;
      case 'longa':
        durationRange = 'entre 15-25 minutos';
        break;
      default:
        durationRange = 'entre 7-12 minutos';
    }

    // Adicionar detalhes da audiência, se fornecidos
    const audienceDetails = audience 
      ? `O público-alvo para estes vídeos é: ${audience}.` 
      : 'Considere um público geral com interesse no assunto.';

    // Construir o prompt
    const prompt = `
    Crie ${safeQuantity} ideias detalhadas para vídeos sobre "${topic}" para o ${platform}.
    
    ${audienceDetails}
    Cada vídeo deve ter aproximadamente uma duração ${durationRange}.
    
    Para cada ideia de vídeo, forneça:
    
    1. Título atraente: Que gere curiosidade e seja otimizado para SEO
    2. Gancho de abertura: Como capturar a atenção nos primeiros 10-15 segundos
    3. Estrutura do conteúdo: Tópicos principais que serão abordados (5-7 pontos)
    4. Call-to-action: O que você quer que os espectadores façam após assistir
    5. Descrição: Um resumo de 2-3 parágrafos para a caixa de descrição do vídeo
    6. Tags recomendadas: 5-8 palavras-chave relevantes
    
    As ideias devem ser:
    - Relevantes para o tema solicitado
    - Otimizadas para gerar engajamento e retenção de espectadores
    - Adaptadas às particularidades do ${platform}
    - Factíveis de serem produzidas com recursos razoáveis
    
    Numere claramente cada ideia de vídeo para fácil referência.
    `;

    // Inicializar o cliente OpenAI apenas quando necessário
    const openai = getOpenAIClient();

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em produção de vídeos e estratégia de conteúdo para plataformas digitais." 
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