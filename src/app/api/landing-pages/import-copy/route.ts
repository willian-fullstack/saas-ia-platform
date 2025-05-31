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
      this.baseUrl = 'https://api.deepseek.com';
      this.model = 'deepseek-chat';
    } else {
      throw new Error("API de IA não configurada corretamente");
    }
  }

  // Função para enviar uma mensagem para a API de chat
  async chatCompletion({ messages, temperature = 0.7, max_tokens = 3000 }: { 
    messages: { role: string, content: string }[], 
    temperature?: number, 
    max_tokens?: number 
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na API DeepSeek:', errorData);
        throw new Error(`Erro na API DeepSeek: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erro ao chamar a API DeepSeek:', error);
      throw error;
    }
  }
}

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
    const { title, copyText, style, images } = await request.json();

    // Validar campos obrigatórios
    if (!title || !copyText) {
      return NextResponse.json(
        { success: false, message: 'Título e texto da copy são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar cliente para a API de IA
    const aiClient = new AIClient();

    // Prompt para gerar HTML baseado na copy
    const prompt = `
      Você é um especialista em criar landing pages de alta conversão. 
      Vou fornecer um texto de copy/texto de venda e algumas imagens, e você criará um HTML completo para uma landing page atrativa e responsiva.
      
      Estilo visual desejado: ${style || 'minimalista'}
      
      Texto da copy:
      ${copyText}
      
      ${images && images.length > 0 ? `
      URLs das imagens disponíveis:
      ${images.map((url: string, index: number) => `${index + 1}. ${url}`).join('\n')}
      
      Instruções para imagens:
      - Use estas imagens de forma estratégica na landing page
      - Não use src="data:image/..." (base64)
      - Use apenas as URLs fornecidas acima
      - Distribua as imagens em seções relevantes da página
      ` : 'Não há imagens disponíveis para esta landing page.'}
      
      Requisitos:
      1. Crie um HTML completo e válido com tags <html>, <head> e <body>
      2. Inclua CSS inline ou em uma tag <style> no <head>
      3. A página deve ser totalmente responsiva
      4. Use design moderno e atraente no estilo ${style || 'minimalista'}
      5. Organize o conteúdo em seções lógicas (benefícios, depoimentos, CTA, etc.)
      6. Adicione elementos de conversão (botões, formulários simples)
      7. Otimize o texto para SEO e conversão
      8. A página deve funcionar completamente offline (sem recursos externos)
      9. Não use bibliotecas externas como Bootstrap ou jQuery
      
      Entregue apenas o código HTML completo, sem explicações.
    `;

    // Gerar HTML com a IA
    console.log('Enviando prompt para a IA gerar a landing page...');
    const htmlContent = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Gerar descrição com a IA
    const descriptionPrompt = `
      Com base nesta copy, crie uma descrição curta (máximo 160 caracteres) que resuma o objetivo da landing page:
      
      ${copyText.substring(0, 500)}...
      
      Forneça apenas a descrição, sem explicações adicionais.
    `;

    console.log('Gerando descrição para a landing page...');
    const description = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: descriptionPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    }) || '';

    // Gerar tags com a IA
    const tagsPrompt = `
      Com base nesta copy, gere 3 a 5 tags relevantes separadas por vírgula:
      
      ${copyText.substring(0, 300)}...
      
      Forneça apenas as tags separadas por vírgula, sem explicações.
    `;

    console.log('Gerando tags para a landing page...');
    const tagsString = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: tagsPrompt }
      ],
      temperature: 0.7,
      max_tokens: 50,
    }) || '';
    
    const tags = tagsString.split(',').map((tag: string) => tag.trim());

    // Verificar se o HTML foi gerado corretamente
    if (!htmlContent || htmlContent.trim() === '') {
      throw new Error('A IA não conseguiu gerar o conteúdo HTML');
    }

    // Limpar qualquer HTML que possa estar fora das tags principais
    const finalHtml = htmlContent.trim();

    // Criar landing page no banco de dados
    const landingPage = await createLandingPage({
      title: title,
      description: description,
      html: finalHtml,
      tags: tags,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Landing page criada com sucesso a partir da copy',
      data: landingPage
    });

  } catch (error) {
    console.error('Erro ao processar a importação de copy:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao importar copy: ${error.message}` 
          : 'Erro desconhecido ao importar copy'
      },
      { status: 500 }
    );
  }
} 