import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createSession, initSessionStorage, addSessionMessage, updateSessionContent } from '../utils';
import fs from 'fs';
import path from 'path';
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

  async chatCompletionStream(params: {
    messages: any[];
    max_tokens?: number;
    temperature?: number;
  }) {
    const { messages, max_tokens = 4096, temperature = 0.7 } = params;

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
        stream: true,
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

    if (!response.body) {
      throw new Error("Response body is null");
    }

    return response.body;
  }
}

// Inicializar cliente de IA
const aiClient = new AIClient();

// Inicializar armazenamento de sessões
initSessionStorage();

// Caminho para prompt avançado
const promptAvancadoPath = path.join(process.cwd(), 'src', 'prompts', 'deepsite-prompt.txt');
let promptAvancado = '';

// Carregar o prompt avançado, se existir
try {
  if (fs.existsSync(promptAvancadoPath)) {
    promptAvancado = fs.readFileSync(promptAvancadoPath, 'utf-8');
    console.log('Prompt avançado carregado com sucesso');
  } else {
    promptAvancado = `Você é um especialista em desenvolvimento web e design de landing pages. 
Ajude a melhorar esta landing page, respondendo às dúvidas do usuário e sugerindo melhorias específicas.
Quando sugerir alterações de código, use o formato de diferença:

<<<<<<< SEARCH
[código HTML original a ser substituído]
=======
[novo código HTML]
>>>>>>> REPLACE`;
    console.log('Arquivo de prompt não encontrado, usando prompt padrão');
  }
} catch (error) {
  console.error('Erro ao carregar prompt avançado:', error);
  promptAvancado = 'Você é um especialista em desenvolvimento web. Ajude o usuário a melhorar esta landing page.';
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave da API está configurada
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      console.error('Nenhuma API de IA configurada');
      return NextResponse.json({ error: 'Nenhuma API de IA configurada' }, { status: 500 });
    }
    
    // Obter informações do usuário da sessão
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Processar o formulário multipart
    const formData = await request.formData();
    console.log('[DeepSite API] Chaves recebidas no FormData:', Array.from(formData.keys()));
    
    // Tentar obter a mensagem do usuário de diferentes campos possíveis
    let prompt = formData.get('message') as string;
    if (!prompt) {
      prompt = formData.get('prompt') as string;
    }
    
    const html = formData.get('html') as string;
    const sessionId = formData.get('sessionId') as string;
    const image = formData.get('image') as File | null;
    
    console.log('[DeepSite API] Valores recebidos:', { 
      promptExiste: !!prompt, 
      htmlExiste: !!html, 
      sessionIdExiste: !!sessionId,
      imageExiste: !!image
    });
    
    if (!prompt) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Função para extrair partes relevantes do HTML para reduzir o tamanho
    const extractRelevantHtml = (fullHtml: string, maxLength: number = 35000) => {
      if (fullHtml.length <= maxLength) return fullHtml;
      
      try {
        // Extrair conteúdo do body, se possível
        const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let relevantHtml = bodyMatch ? bodyMatch[1] : fullHtml;
        
        // Se ainda for muito grande, pegar o início e o fim
        if (relevantHtml.length > maxLength) {
          const halfLength = Math.floor(maxLength / 2);
          relevantHtml = relevantHtml.substring(0, halfLength) + 
            '\n\n... [Conteúdo do meio truncado] ...\n\n' +
            relevantHtml.substring(relevantHtml.length - halfLength);
        }
        
        // Adicionar comentários HTML no início e fim para indicar que é um trecho
        return `<!-- Início do trecho de HTML -->\n${relevantHtml}\n<!-- Fim do trecho de HTML -->`;
      } catch (error) {
        console.error('Erro ao extrair partes relevantes do HTML:', error);
        // Em caso de erro, truncar simplesmente
        return fullHtml.substring(0, maxLength) + '\n\n... [Conteúdo truncado] ...';
      }
    };
    
    // Verificar se o usuário tem sessão válida
    let currentSessionId = sessionId;
    if (!currentSessionId || !global.deepsiteSessions?.[currentSessionId]) {
      // Criar uma nova sessão se não existir
      currentSessionId = createSession(userId, html, 'Landing Page');
    } else if (global.deepsiteSessions[currentSessionId].userId !== userId && session?.user?.id) {
      // Verificar propriedade apenas se o usuário estiver autenticado
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    } else {
      // Atualizar conteúdo HTML da sessão se mudou
      const currentHtml = global.deepsiteSessions[currentSessionId].content;
      if (currentHtml !== html) {
        updateSessionContent(currentSessionId, html);
      }
    }
    
    // Preparar instruções sobre imagem, se houver
    let imageInstructions = '';
    if (image) {
      try {
        console.log("Imagem detectada:", image.name, "tamanho:", image.size);
        
        // Gerar um nome de arquivo único com timestamp
        const timestamp = Date.now();
        const originalName = image.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fileName = `${timestamp}-${originalName}`;
        
        // Salvar a imagem no diretório de uploads
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Garantir que o diretório de uploads exista
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, fileName);
        
        await fs.promises.mkdir(uploadDir, { recursive: true });
        await fs.promises.writeFile(filePath, buffer);
        
        console.log(`Imagem salva com sucesso em: ${filePath}`);
        
        const imageUrl = `/uploads/${fileName}`;
        
        imageInstructions = `
O usuário enviou uma imagem chamada "${originalName}" que foi salva em "${imageUrl}".

MUITO IMPORTANTE: Você DEVE incorporar esta imagem na landing page com o caminho exato:
<img src="${imageUrl}" alt="${originalName}" class="responsive-image" width="100%" />

Use EXATAMENTE o caminho ${imageUrl} para a imagem - não modifique ou substitua este caminho.
`;
      } catch (error) {
        console.error("Erro ao salvar a imagem:", error);
        imageInstructions = `
O usuário tentou enviar uma imagem, mas ocorreu um erro ao salvá-la.
Por favor, informe ao usuário que houve um problema com o upload da imagem e sugira que ele tente novamente.
`;
      }
    }
    
    // Registrar a mensagem do usuário na sessão
    addSessionMessage(currentSessionId, 'user', prompt);
    
    // Preparar as mensagens para a API
    const messages = [
      {
        role: 'system',
        content: promptAvancado
      },
      {
        role: 'user',
        content: `Aqui está o HTML atual da landing page:

\`\`\`html
${html.length > 35000 ? extractRelevantHtml(html) : html}
\`\`\`

${html.length > 35000 ? 'IMPORTANTE: O HTML foi truncado devido ao seu tamanho. Trabalhe com o trecho fornecido, e considere que suas sugestões devem ser aplicáveis mesmo que não veja todo o código.\n\n' : ''}Solicitação do usuário: ${prompt}${imageInstructions ? '\n\n' + imageInstructions : ''}

Por favor, faça as modificações necessárias e retorne os blocos de diferença.`
      }
    ];
    
    try {
      // Criar stream de resposta
      const streamBody = await aiClient.chatCompletionStream({
        messages: messages,
        max_tokens: 4000, // Reduzindo para economizar tokens
        temperature: 0.7,
      });
      
      // Criar um stream legível para enviar ao cliente
      const readableStream = new ReadableStream({
        async start(controller) {
          if (!streamBody) {
            controller.close();
            return;
          }
          
          // Tratar streamBody como NodeJS.ReadableStream
          const nodeStream = streamBody as NodeJS.ReadableStream;
          
          // Configurar o processamento de stream por chunks
          const decoder = new TextDecoder();
          let buffer = '';
          let assistantResponse = '';
          
          nodeStream.on('data', (chunk) => {
            const text = decoder.decode(chunk, { stream: true });
            buffer += text;
            
            // Processar linhas completas
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Manter a última linha incompleta no buffer
            
            for (const line of lines) {
              // Pular linhas vazias
              if (!line.trim()) continue;
              
              // Remover o prefixo "data: " e processar como JSON
              if (line.startsWith('data: ')) {
                const jsonData = line.slice(5);
                
                // Verificar se é o marcador de [DONE]
                if (jsonData.trim() === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsedData = JSON.parse(jsonData);
                  
                  // Extrair o conteúdo da mensagem
                  if (parsedData.choices && parsedData.choices[0]) {
                    // Delta para streaming vs. conteúdo completo para não-streaming
                    const content = parsedData.choices[0].delta?.content || 
                                    parsedData.choices[0].message?.content || '';
                    
                    if (content) {
                      // Enviar o conteúdo para o cliente
                      controller.enqueue(new TextEncoder().encode(content));
                      assistantResponse += content;
                      
                      // Procurar por padrões de blocos de substituição HTML no conteúdo acumulado até agora
                      const htmlPattern = /<<<<<<< SEARCH([\s\S]*?)=======([\s\S]*?)>>>>>>> REPLACE/g;
                      let match;
                      let hasMatches = false;
                      
                      while ((match = htmlPattern.exec(assistantResponse)) !== null) {
                        hasMatches = true;
                        console.log("[DeepSite] Encontrado padrão de substituição HTML!");
                        console.log(`[DeepSite] Buscar: ${match[1].substring(0, 100)}...`);
                        console.log(`[DeepSite] Substituir: ${match[2].substring(0, 100)}...`);
                      }
                      
                      if (hasMatches) {
                        console.log("[DeepSite] Padrões de substituição encontrados na resposta");
                      }
                    }
                  }
                } catch (error) {
                  console.error('Erro ao processar JSON:', error, jsonData);
                }
              }
            }
          });
          
          nodeStream.on('end', () => {
            // Salvar a resposta completa na sessão
            if (assistantResponse) {
              addSessionMessage(currentSessionId, 'assistant', assistantResponse);
            }
            controller.close();
          });
          
          nodeStream.on('error', (error) => {
            console.error('Erro no stream da API:', error);
            controller.error(error);
          });
        }
      });
      
      // Retornar resposta de streaming
      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
      
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      return NextResponse.json({ 
        error: `Erro ao gerar resposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sessionId: currentSessionId 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Erro na requisição:', error);
    return NextResponse.json({ 
      error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }, { status: 500 });
  }
} 