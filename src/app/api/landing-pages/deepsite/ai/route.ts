import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { streamAIResponse } from '../utils';

// Definição da interface DeepSiteSession
declare global {
  namespace NodeJS {
    interface Global {
      deepsiteSessions: {
        [key: string]: {
          id: string;
          userId: string;
          html: string;
          title: string;
          messages: any[];
          createdAt: Date;
          updatedAt: Date;
        };
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    // Permitir uso mesmo sem autenticação para fins de desenvolvimento
    console.log('Sessão de usuário:', session ? 'Presente' : 'Ausente');
    
    // Obter dados da requisição
    const { prompt, sessionId } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }
    
    console.log('Processando prompt:', prompt.substring(0, 100) + '...');
    console.log('ID da sessão:', sessionId);
    
    // Inicializar a sessão se não existir
    if (!global.deepsiteSessions) {
      global.deepsiteSessions = {};
    }
    
    if (!global.deepsiteSessions[sessionId]) {
      const now = new Date();
      global.deepsiteSessions[sessionId] = {
        id: sessionId,
        userId: 'anonymous-user',
        html: '',
        title: 'Nova Landing Page',
        messages: [],
        createdAt: now,
        updatedAt: now
      };
    }
    
    // Adicionar instruções de responsividade ao prompt
    const enhancedPrompt = `${prompt}
    
INSTRUÇÕES DE RESPONSIVIDADE:
1. A landing page DEVE ser totalmente responsiva para todos os dispositivos (mobile, tablet, desktop)
2. Use Bootstrap 5 ou Tailwind CSS para garantir responsividade
3. Inclua a meta tag viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0">
4. Use unidades relativas (%, rem, em) em vez de pixels fixos
5. Implemente media queries para ajustes específicos quando necessário
6. Certifique-se de que todas as imagens sejam fluidas com max-width: 100%
7. Use classes de grid responsivas (como col-md-6, col-lg-4)
8. Teste o layout em diferentes tamanhos de tela
9. Certifique-se de que o texto seja legível em todos os dispositivos
10. Implemente um menu de navegação que se adapte a dispositivos móveis`;
    
    // Enviar a solicitação para a API de IA
    const stream = await streamAIResponse(enhancedPrompt, sessionId);
    
    return new Response(stream);
  } catch (error: any) {
    console.error('Erro ao processar solicitação de IA:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
} 