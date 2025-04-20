import { NextResponse } from "next/server";
import OpenAI from "openai";

// Configure a API da OpenAI
// Note: Em produção, utilize variáveis de ambiente para a chave de API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      copyType,
      framework,
      niche,
      emotion,
      customNiche,
      productName,
      target,
      keyPoints,
      tone,
    } = body;

    // Validação de entrada
    if (!copyType || !framework || !niche || !emotion || !productName || !target || !keyPoints || !tone) {
      return new NextResponse(
        JSON.stringify({
          error: "Campos obrigatórios faltando",
          details: "Todos os campos são necessários para gerar o copy."
        }),
        { status: 400 }
      );
    }

    // Se o nicho for "outro", o customNiche deve ser fornecido
    if (niche === "outro" && !customNiche) {
      return new NextResponse(
        JSON.stringify({
          error: "Nicho personalizado não especificado",
          details: "Quando 'outro' é selecionado, é necessário fornecer um nicho personalizado."
        }),
        { status: 400 }
      );
    }

    // Criar prompt com base nos parâmetros
    const nicheValue = niche === "outro" ? customNiche : niche;

    const systemPrompt = `Você é um copywriter profissional especializado em conteúdo para ${nicheValue}.
    Seu objetivo é criar um texto persuasivo no formato ${copyType} usando a estrutura ${framework}.
    Use um tom ${tone} e foque na emoção ${emotion}.

    Use emojis estrategicamente para tornar o texto mais atraente.
    Formate bem o texto com quebras de linha, marcadores e ênfases quando necessário.`;

    const userPrompt = `Crie um copy para o produto: "${productName}"
    
    Público-alvo: ${target}
    
    Principais pontos a serem abordados:
    ${keyPoints}`;

    // Chamar a API da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extrair o texto gerado
    const generatedCopy = response.choices[0].message.content;

    // Retornar o resultado
    return NextResponse.json({
      success: true,
      copy: generatedCopy,
      metadata: {
        copyType,
        framework,
        niche: nicheValue,
        emotion,
        tone,
      }
    });
  } catch (error) {
    console.error("Erro ao gerar copywriting:", error);
    
    return new NextResponse(
      JSON.stringify({
        error: "Erro interno",
        details: "Ocorreu um erro ao processar sua solicitação."
      }),
      { status: 500 }
    );
  }
} 