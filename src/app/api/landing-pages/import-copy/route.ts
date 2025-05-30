import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDB } from '@/lib/db/connection';
import { createLandingPage, getLandingPageById } from '@/lib/db/models/LandingPage';
import fetch from 'node-fetch';

// Classe para interagir com a API de IA
class AIClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    // Determinar qual API usar baseado nas variáveis de ambiente
    if (process.env.DEEPSEEK_API_KEY) {
      this.apiKey = process.env.DEEPSEEK_API_KEY;
      this.baseUrl = "https://api.deepseek.com";
      this.model = process.env.DEEPSEEK_MODEL_ID || "deepseek-chat";
    } else if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.baseUrl = "https://api.openai.com";
      this.model = process.env.OPENAI_MODEL_ID || "gpt-4o";
    } else {
      throw new Error("Nenhuma API de IA configurada");
    }
  }

  async chatCompletion(params: {
    messages: any[];
    max_tokens?: number;
    temperature?: number;
  }) {
    const { messages, max_tokens = 4000, temperature = 0.7 } = params;

    console.log(`[AI API] Enviando requisição para modelo: ${this.model}`);
    
    // Escolher endpoint baseado na API configurada
    const endpoint = this.baseUrl.includes('deepseek')
      ? `${this.baseUrl}/v1/chat/completions`
      : `${this.baseUrl}/v1/chat/completions`;
    
    // Garantir que max_tokens esteja dentro dos limites permitidos
    const safeMaxTokens = Math.min(16000, max_tokens);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: safeMaxTokens,
        temperature,
      }),
    });

    console.log(`[AI API] Resposta recebida: status=${response.status}`);
      
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("[AI API] Erro detalhado:", JSON.stringify(errorData));
        errorMessage = `API error: ${response.status} ${errorData.error?.message || response.statusText}`;
      } catch (e) {
        console.error("Erro ao processar resposta de erro:", e);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.choices[0].message.content || '';
  }
}

// Inicializar cliente de IA
const aiClient = new AIClient();

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Conectar ao banco de dados
    await connectToDB();

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { title, copyText, style, images } = body;

    // Validar campos obrigatórios
    if (!title || !copyText) {
      return NextResponse.json(
        { success: false, message: 'Título e texto da copy são obrigatórios' },
        { status: 400 }
      );
    }

    // Estruturar prompt para a IA
    const systemPrompt = `Você é um especialista em criar landing pages de alta conversão.
    Você receberá um texto de copy e deverá transformá-lo em uma landing page HTML completa e responsiva.
    
    Siga estas instruções ao gerar o HTML:
    1. Analise a copy para identificar: título principal, subtítulos, benefícios, prova social, chamada para ação, etc.
    2. Crie uma estrutura de landing page organizada com seções bem definidas
    3. Use as imagens fornecidas pelo usuário (referenciadas como {IMAGE_1}, {IMAGE_2}, etc.)
    4. Adicione estilos CSS inline ou em uma tag <style> para garantir um design ${style}
    5. Crie uma página responsiva que funcione bem em dispositivos móveis e desktop
    6. Inclua botões de CTA em pontos estratégicos
    7. Adicione elementos de prova social, como depoimentos ou selos de confiança
    8. Crie a página completa com HTML, CSS e JavaScript se necessário
    9. Use apenas código HTML, CSS e JavaScript puro (não use frameworks como React)
    10. Adicione tags de rastreamento para Google Analytics (<!-- GA tag -->)
    
    Retorne APENAS o código HTML completo, sem explicações ou comentários adicionais.`;

    // Processar imagens
    let promptWithImages = copyText;
    if (images && images.length > 0) {
      // Adicionar placeholders para imagens no prompt
      promptWithImages += "\n\nImagens disponíveis para uso:\n";
      images.forEach((img: string, index: number) => {
        promptWithImages += `{IMAGE_${index + 1}} - Disponível para uso\n`;
      });
    }

    // Fazer requisição para a IA
    const html = await aiClient.chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptWithImages }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Substituir os placeholders de imagem pelos dados reais
    let finalHtml = html;
    if (images && images.length > 0) {
      images.forEach((img: string, index: number) => {
        const placeholder = `{IMAGE_${index + 1}}`;
        finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), img);
      });
    }

    // Criar descrição com IA
    const descriptionPrompt = `Com base no seguinte texto de copy, crie uma descrição curta (máximo 150 caracteres) que resuma o objetivo da landing page:\n\n${copyText.substring(0, 500)}...`;
    
    const description = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: descriptionPrompt }
      ],
      temperature: 0.7,
      max_tokens: 100,
    }) || 'Landing page gerada a partir de copy importada';
    
    // Extrair tags do texto
    const tagsPrompt = `Extraia até 5 tags relevantes do seguinte texto de copy. Retorne apenas as tags separadas por vírgula, sem pontuação adicional:\n\n${copyText.substring(0, 500)}...`;
    
    const tagsString = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: tagsPrompt }
      ],
      temperature: 0.7,
      max_tokens: 50,
    }) || '';
    
    const tags = tagsString.split(',').map((tag: string) => tag.trim());

    // Criar landing page no banco de dados
    const landingPage = await createLandingPage({
      title: title,
      description: description,
      html: finalHtml,
      tags: tags,
      userId: session.user.id,
    });

    // Retornar resposta de sucesso
    return NextResponse.json(
      { 
        success: true, 
        message: 'Landing page criada com sucesso',
        data: landingPage
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao processar importação de copy:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao processar copy: ${error.message}` 
          : 'Erro desconhecido ao processar copy'
      },
      { status: 500 }
    );
  }
} 