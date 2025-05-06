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
      quantity = 15,
      language = 'português',
      type = 'general'
    } = await request.json();

    // Validar os parâmetros necessários
    if (!topic) {
      return NextResponse.json(
        { error: 'O parâmetro "topic" é obrigatório' },
        { status: 400 }
      );
    }

    // Limitar quantidade para evitar tokens excessivos
    const safeQuantity = Math.min(Math.max(parseInt(quantity) || 15, 5), 30);

    // Determinar detalhes com base no tipo
    let typeInstructions = '';
    
    switch (type.toLowerCase()) {
      case 'trending':
        typeInstructions = 'Foque em hashtags que estão em alta e são tendência atualmente.';
        break;
      case 'niche':
        typeInstructions = 'Foque em hashtags específicas de nicho, menos competitivas, mas altamente relevantes.';
        break;
      case 'branded':
        typeInstructions = 'Inclua algumas hashtags de marca que poderiam ser adequadas para o tema.';
        break;
      case 'engagement':
        typeInstructions = 'Priorize hashtags que tendem a gerar mais engajamento e visualizações.';
        break;
      default:
        typeInstructions = 'Forneça uma mistura equilibrada de hashtags populares e de nicho.';
    }

    // Construir o prompt
    const prompt = `
    Gere um conjunto estratégico de ${safeQuantity} hashtags em ${language} relacionadas ao tópico "${topic}".
    
    ${typeInstructions}
    
    Para cada hashtag:
    - Remova espaços
    - Garanta que comecem com # (símbolo de hashtag)
    - Siga o formato camelCase para hashtags com várias palavras
    
    Organize as hashtags em três categorias:
    1. Alta Popularidade (hashtags muito buscadas, com grande alcance)
    2. Média Popularidade (equilíbrio entre alcance e competição)
    3. Nicho (menos competitivas, mais específicas)
    
    Para cada categoria, inclua:
    - Um breve título
    - As hashtags recomendadas
    - Uma explicação curta de quando usar hashtags dessa categoria
    
    Ao final, crie uma seção "Conjunto Recomendado" com uma seleção balanceada das melhores hashtags das três categorias.
    `;

    // Inicializar o cliente OpenAI apenas quando necessário
    const openai = getOpenAIClient();

    // Realizar a chamada para o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          "role": "system", 
          "content": "Você é um especialista em marketing digital e estratégia de hashtags." 
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