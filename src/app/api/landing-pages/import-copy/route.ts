import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDB } from '@/lib/db/connection';
import { createLandingPage, getLandingPageById, ILandingPage } from '@/lib/db/models/LandingPage';
import fetch from 'node-fetch';

// Função para limpar o HTML de explicações e textos extras
function cleanHtmlContent(content: string): string {
  // Se o conteúdo começa com explicações em markdown ou texto
  if (!content.trim().startsWith('<!DOCTYPE') && !content.trim().startsWith('<html') && !content.trim().startsWith('<HTML')) {
    // Tentar encontrar o início do HTML
    const docTypeIndex = content.indexOf('<!DOCTYPE');
    const htmlStartIndex = content.indexOf('<html');
    const HTML_START_INDEX = content.indexOf('<HTML');
    
    let startIndex = -1;
    if (docTypeIndex >= 0) startIndex = docTypeIndex;
    else if (htmlStartIndex >= 0) startIndex = htmlStartIndex;
    else if (HTML_START_INDEX >= 0) startIndex = HTML_START_INDEX;
    
    if (startIndex >= 0) {
      console.log('Removendo texto explicativo no início do HTML');
      return content.substring(startIndex);
    }
  }
  
  // Se o conteúdo termina com explicações
  const htmlEndIndex = content.lastIndexOf('</html>');
  if (htmlEndIndex >= 0 && htmlEndIndex + 7 < content.length) {
    console.log('Removendo texto explicativo no final do HTML');
    return content.substring(0, htmlEndIndex + 7); // +7 para incluir o </html>
  }
  
  // Remover marcações de código markdown
  if (content.startsWith('```html') || content.startsWith('```')) {
    console.log('Removendo marcações de código markdown');
    let cleaned = content;
    cleaned = cleaned.replace(/^```html\n/, '');
    cleaned = cleaned.replace(/^```\n/, '');
    cleaned = cleaned.replace(/\n```$/, '');
    return cleaned;
  }
  
  return content;
}

// Classe para interagir com a API de IA
class AIClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxContextLength: number;

  constructor() {
    // Determinar qual API usar baseado nas variáveis de ambiente
    if (process.env.DEEPSEEK_API_KEY) {
      this.apiKey = process.env.DEEPSEEK_API_KEY;
      this.baseUrl = 'https://api.deepseek.com';
      this.model = 'deepseek-chat';
      this.maxContextLength = 60000; // Limite seguro para DeepSeek (real é 65536)
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
      // Estimar o tamanho total da requisição em tokens
      let totalTokens = max_tokens; // Tokens reservados para a resposta
      
      for (const msg of messages) {
        totalTokens += this.estimateTokenCount(msg.content);
      }
      
      console.log(`Estimativa total de tokens da requisição: ${totalTokens}`);
      
      if (totalTokens > this.maxContextLength) {
        console.error(`AVISO: A requisição excede o limite seguro de tokens (${this.maxContextLength})`);
        // Aplicar truncamento de emergência se ainda estiver muito grande
        if (messages.length === 1 && messages[0].role === 'user') {
          const safeLimit = Math.floor(this.maxContextLength * 0.8) - max_tokens;
          console.log(`Aplicando truncamento de emergência para ${safeLimit} tokens`);
          
          const originalContent = messages[0].content;
          const safeChars = Math.floor(safeLimit * 2); // Estimativa muito conservadora: 1 token = 2 caracteres
          
          // Truncamento extremamente simplificado para casos de emergência
          messages[0].content = originalContent.substring(0, safeChars);
          console.log(`Conteúdo truncado de ${originalContent.length} para ${messages[0].content.length} caracteres`);
        }
      }
      
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
  
  // Estima o número de tokens aproximado em um texto - ajustado para ser muito mais conservador
  estimateTokenCount(text: string): number {
    // Estimativa muito conservadora: 1 token ≈ 2 caracteres
    // A estimativa anterior estava muito fora da realidade comparada com o que a API reporta
    return Math.ceil(text.length / 2);
  }
  
  // Trunca texto grande mantendo partes importantes - versão muito mais agressiva
  truncateText(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokenCount(text);
    
    if (estimatedTokens <= maxTokens) {
      console.log(`Texto dentro do limite: ${estimatedTokens} tokens (máx: ${maxTokens})`);
      return text; // Não precisa truncar
    }
    
    console.log(`Texto original muito grande: ~${estimatedTokens} tokens. Truncando para ~${maxTokens} tokens.`);
    
    // Truncamento muito mais agressivo
    const charsToKeep = Math.floor(maxTokens * 2); // 2 caracteres por token na nossa nova estimativa
    
    if (charsToKeep >= text.length) {
      return text;
    }
    
    // Estratégia simples: manter apenas o início, que geralmente tem as informações mais importantes
    const truncated = text.substring(0, charsToKeep);
    
    console.log(`Texto truncado: ~${this.estimateTokenCount(truncated)} tokens`);
    
    return truncated;
  }
  
  // Truncamento extremo para caber dentro do limite da API
  createMinimalPrompt(copyText: string, style: string = 'minimalista', images: string[] = []): string {
    // Reduzir drasticamente o texto da copy
    const maxCopyLength = 10000; // Caracteres, não tokens
    let truncatedCopy = copyText;
    if (copyText.length > maxCopyLength) {
      truncatedCopy = copyText.substring(0, maxCopyLength);
      console.log(`Copy reduzida de ${copyText.length} para ${maxCopyLength} caracteres`);
    }
    
    // Criar um prompt muito mais compacto e explícito
    return `Você é um desenvolvedor front-end especializado em landing pages. Crie uma landing page de alta conversão.

IMPORTANTE: Entregue APENAS o código HTML completo e válido. NÃO inclua marcações Markdown, explicações, listas numeradas ou comentários sobre o que você fez.

Estilo: ${style}

Copy:
${truncatedCopy}

${images && images.length > 0 ? `
INSTRUÇÕES PARA IMAGENS (muito importante):
Você DEVE usar as seguintes URLs de imagens na landing page:
${images.map((url: string, index: number) => `${index + 1}. <img src="${url}" alt="Imagem ${index + 1}"/>`).join('\n')}

- Distribua estas imagens em seções relevantes
- Use EXATAMENTE as URLs fornecidas acima
- NÃO use imagens base64 ou outras URLs
- Coloque pelo menos ${Math.min(images.length, 3)} imagens em locais estratégicos
` : 'Não há imagens disponíveis para esta landing page.'}

Requisitos técnicos:
- HTML5 válido e semântico
- CSS em uma tag <style> no <head>
- Design responsivo (mobile-first)
- Apenas recursos locais (nada de CDNs ou bibliotecas externas)

O código deve começar com <!DOCTYPE html> e terminar com </html> sem nenhum texto adicional.`;
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
    
    // Usar o prompt extremamente reduzido para evitar erros de limite de tokens
    const compactPrompt = aiClient.createMinimalPrompt(copyText, style, images);
    
    console.log('Usando prompt compacto para evitar erros de limite de tokens');

    // Gerar HTML com a IA
    console.log('Enviando prompt para a IA gerar a landing page...');
    const htmlContent = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: compactPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Gerar descrição com a IA - usando apenas o início do texto
    const shortCopyForDescription = copyText.substring(0, 200);
    const descriptionPrompt = `Crie descrição curta (máx 160 caracteres) para landing page sobre: ${shortCopyForDescription}...`;

    console.log('Gerando descrição para a landing page...');
    const description = await aiClient.chatCompletion({
      messages: [
        { role: "user", content: descriptionPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    }) || '';

    // Gerar tags com a IA - usando apenas o início do texto
    const shortCopyForTags = copyText.substring(0, 100);
    const tagsPrompt = `Gere 3-5 tags separadas por vírgula para: ${shortCopyForTags}...`;

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
    // e remover qualquer explicação ou markdown que a IA possa ter incluído
    const finalHtml = cleanHtmlContent(htmlContent.trim());

    // Criar landing page no banco de dados
    const landingPage = await createLandingPage({
      title,
      description,
      html: finalHtml,
      tags,
      userId: session.user.id
    } as any); // Usando cast para resolver problema de tipo

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