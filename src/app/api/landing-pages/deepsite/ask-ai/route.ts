import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSession, initSessionStorage } from '../utils';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Classe DeepSeekClient para interagir com a API do DeepSeek
class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.deepseek.com";
  }

  async chatCompletionStream(params: {
    model: string;
    messages: any[];
    max_tokens?: number;
    temperature?: number;
  }) {
    const { model, messages, max_tokens = 4096, temperature = 0.7 } = params;

    console.log(`[DeepSeek API] Enviando requisição para modelo: ${model}`);
    
    // Garantir que max_tokens esteja dentro dos limites permitidos
    const safeMaxTokens = Math.min(16000, max_tokens);
    
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: safeMaxTokens,
        temperature,
        stream: true,
      }),
    });

    console.log(`[DeepSeek API] Resposta recebida: status=${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("[DeepSeek API] Erro detalhado:", JSON.stringify(errorData));
        errorMessage = `DeepSeek API error: ${response.status} ${errorData.error?.message || response.statusText}`;
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

// Inicializar DeepSeek
const deepseek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY || '');
const MODEL_ID = process.env.DEEPSEEK_MODEL_ID || "deepseek-ai/deepseek-coder-v2-instruct-16k";

// Inicializar armazenamento de sessões
initSessionStorage();

// Carregar o prompt avançado
const promptAvancadoPath = path.join(process.cwd(), 'promptavançado.txt');
const promptAvancado = fs.existsSync(promptAvancadoPath) 
  ? fs.readFileSync(promptAvancadoPath, 'utf-8') 
  : '';

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave da API DeepSeek está configurada
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY não está configurada');
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY não está configurada' }, { status: 500 });
    }
    
    // Obter informações do usuário da sessão
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Processar o formulário multipart
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const html = formData.get('html') as string;
    const sessionId = formData.get('sessionId') as string;
    const image = formData.get('image') as File | null;
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o usuário tem sessão válida
    let currentSessionId = sessionId;
    if (!currentSessionId || !global.deepsiteSessions?.[currentSessionId]) {
      // Criar uma nova sessão se não existir
      currentSessionId = createSession(userId, html, 'Landing Page');
    } else if (global.deepsiteSessions[currentSessionId].userId !== userId && session?.user?.id) {
      // Verificar propriedade apenas se o usuário estiver autenticado
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Preparar as mensagens para a API
    const messages = [
      {
        role: 'system',
        content: `Você é um especialista em desenvolvimento web e design de landing pages. 
${promptAvancado}

Você deve analisar o HTML atual da landing page e fazer as modificações solicitadas pelo usuário.
Suas respostas devem seguir este formato:

1. Uma breve explicação do que você vai fazer
2. Os blocos de diferença no seguinte formato:
<<<<<<< SEARCH
[código HTML original a ser substituído]
=======
[novo código HTML]
>>>>>>> REPLACE

Você pode incluir múltiplos blocos de diferença em sua resposta. Certifique-se de incluir contexto suficiente em cada bloco para que a substituição seja precisa.`
      },
      {
        role: 'user',
        content: `Aqui está o HTML atual da landing page:

\`\`\`html
${html}
\`\`\`

Solicitação do usuário: ${prompt}

Por favor, faça as modificações necessárias e retorne os blocos de diferença.`
      }
    ];
    
    // Nota: DeepSeek não suporta imagens atualmente, então não adicionamos a imagem às mensagens
    if (image) {
      console.log("Aviso: Upload de imagem detectado, mas DeepSeek não suporta entrada de imagens. A imagem será ignorada.");
    }
    
    try {
      // Criar stream de resposta
      const streamBody = await deepseek.chatCompletionStream({
        model: MODEL_ID,
        messages: messages,
        max_tokens: 8000,
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
          
          nodeStream.on('data', (chunk) => {
            const text = decoder.decode(chunk, { stream: true });
            buffer += text;
            
            // Processar linhas completas
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Manter a última linha incompleta no buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  console.error('Erro ao analisar chunk do DeepSeek:', e);
                }
              }
            }
          });
          
          nodeStream.on('end', () => {
            // Processar qualquer conteúdo restante no buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.replace('data: ', '').trim();
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    
                    if (content) {
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(content));
                    }
                  } catch (e) {
                    console.error('Erro ao analisar chunk final do DeepSeek:', e);
                  }
                }
              }
            }
            controller.close();
          });
          
          nodeStream.on('error', (error) => {
            console.error('Erro no stream do DeepSeek:', error);
            controller.error(error);
          });
        }
      });
      
      // Retornar o stream como resposta
      return new NextResponse(readableStream);
    } catch (error: any) {
      console.error('Erro ao criar stream do DeepSeek:', error);
      return NextResponse.json({ error: error.message || 'Erro ao criar stream de resposta' }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
} 