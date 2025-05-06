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
      message, 
      history = [],
      context = '',
      expertiseArea = 'marketing digital',
    } = await request.json();

    // Validar os parâmetros necessários
    if (!message) {
      return NextResponse.json(
        { error: 'O parâmetro "message" é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar o histórico de conversas para contexto
    const formattedHistory = history.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));

    // Construir as instruções do sistema
    const systemPrompt = `
    Você é um consultor especialista em ${expertiseArea}, disponível 24 horas por dia para ajudar empreendedores 
    e criadores de conteúdo com orientações, ideias e estratégias.
    
    Sua missão é fornecer respostas claras, práticas e acionáveis que possam ser implementadas imediatamente.
    
    Informações adicionais sobre o usuário/contexto:
    ${context || 'Nenhuma informação adicional fornecida.'}
    
    Diretrizes:
    - Seja objetivo e direto
    - Forneça exemplos práticos quando relevante
    - Sugira ferramentas e recursos úteis
    - Proponha ideias inovadoras, mas realizáveis
    - Adapte suas respostas ao nível de conhecimento demonstrado pelo usuário
    - Se não souber algo com certeza, seja honesto e sugira alternativas
    - Sempre tente oferecer um próximo passo prático
    
    Responda em português do Brasil em um tom profissional, mas acessível.
    `;

    // Montar o array de mensagens
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    // Inicializar o cliente OpenAI apenas quando necessário
    const openai = getOpenAIClient();

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extrair e retornar o resultado
    const result = completion.choices[0].message.content;

    return NextResponse.json({ 
      result,
      messageId: Date.now().toString()
    });

  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação', details: error.message },
      { status: 500 }
    );
  }
} 