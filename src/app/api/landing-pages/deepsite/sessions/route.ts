import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initSessionStorage, createSession, updateSessionContent, getSessionContent } from '../utils';
import { getLandingPageById } from '@/lib/db/models/LandingPage';
import { connectToDB } from '@/lib/db/connection';

// Inicializar armazenamento de sessões
initSessionStorage();

// GET - Obter todas as sessões do usuário ou uma sessão específica
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Usuário não autenticado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Encontrar sessão específica por ID
    if (url.searchParams.has('id')) {
      const sessionId = url.searchParams.get('id');
      
      if (!sessionId || !global.deepsiteSessions || !global.deepsiteSessions[sessionId]) {
        return NextResponse.json({ success: false, message: 'Sessão não encontrada' }, { status: 404 });
      }
      
      const deepSession = global.deepsiteSessions[sessionId];
      
      // Verificar permissão
      if (deepSession.userId !== userId) {
        return NextResponse.json({ success: false, message: 'Acesso negado a esta sessão' }, { status: 403 });
      }
      
      // Obter conteúdo usando o novo método
      const content = getSessionContent(sessionId);
      
      // Se o conteúdo estiver vazio e existe uma landing page associada, buscar o HTML
      if ((!content || content.trim() === '') && deepSession.landingPageId) {
        try {
          // Tentar obter o HTML da landing page associada
          await connectToDB();
          const landingPage = await getLandingPageById(deepSession.landingPageId);
          
          if (landingPage && landingPage.html) {
            // Atualizar a sessão com o HTML da landing page
            updateSessionContent(sessionId, landingPage.html);
            
            console.log(`Recuperado HTML da landing page ${deepSession.landingPageId} para sessão ${sessionId}`);
            
            // Retornar sessão com o HTML atualizado
            return NextResponse.json({
              success: true,
              data: {
                ...deepSession,
                content: landingPage.html,
                html: landingPage.html, // Incluir ambos os campos para compatibilidade
                lastActivity: new Date(), // Atualizar timestamp
                messages: deepSession.messages || []
              }
            });
          }
        } catch (error) {
          console.error('Erro ao recuperar HTML da landing page:', error);
        }
      }
      
      // Atualizar o último acesso
      global.deepsiteSessions[sessionId].lastActivity = new Date();
      
      // Incluir ambos content e html para compatibilidade
      return NextResponse.json({
        success: true,
        data: {
          ...deepSession,
          html: content, // Garantir que html também esteja disponível
          content: content, // Garantir que content também esteja disponível
          messages: deepSession.messages || []
        }
      });
    }
    
    // Caso contrário, listar todas as sessões do usuário
    const userSessions = Object.values(global.deepsiteSessions || {})
      .filter(s => s.userId === userId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    
    return NextResponse.json({
      success: true,
      data: userSessions
    });
    
  } catch (error) {
    console.error('Erro ao obter sessões:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao obter sessões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// POST - Criar uma nova sessão DeepSite a partir de uma landing page existente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const { landingPageId, sessionName } = await request.json();
    
    if (!landingPageId) {
      return NextResponse.json({
        success: false,
        message: "ID da landing page é obrigatório"
      }, { status: 400 });
    }
    
    // Buscar a landing page
    const landingPage = await getLandingPageById(landingPageId);
    
    if (!landingPage) {
      return NextResponse.json({
        success: false,
        message: "Landing page não encontrada"
      }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso à landing page
    if (landingPage.userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: "Você não tem permissão para acessar esta landing page"
      }, { status: 403 });
    }
    
    // Criar uma nova sessão DeepSite
    const name = sessionName || `Edição de ${landingPage.title}`;
    const sessionId = createSession(session.user.id, landingPage.html, name);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        name,
        createdAt: global.deepsiteSessions[sessionId].createdAt
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar sessão DeepSite:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao criar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// PUT - Atualizar o conteúdo de uma sessão DeepSite existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const { sessionId, content } = await request.json();
    
    if (!sessionId || !content) {
      return NextResponse.json({
        success: false,
        message: "ID da sessão e conteúdo são obrigatórios"
      }, { status: 400 });
    }
    
    // Verificar se a sessão existe
    if (!global.deepsiteSessions?.[sessionId]) {
      return NextResponse.json({
        success: false,
        message: "Sessão não encontrada"
      }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso a esta sessão
    const deepSiteSession = global.deepsiteSessions[sessionId];
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: "Acesso negado a esta sessão"
      }, { status: 403 });
    }
    
    // Atualizar o conteúdo da sessão
    const success = updateSessionContent(sessionId, content);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        message: "Erro ao atualizar o conteúdo da sessão"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Conteúdo da sessão atualizado com sucesso"
    });
    
  } catch (error) {
    console.error('Erro ao atualizar sessão DeepSite:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao atualizar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// DELETE - Excluir uma sessão DeepSite
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Obter ID da sessão da URL
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: "ID da sessão é obrigatório"
      }, { status: 400 });
    }
    
    // Verificar se a sessão existe
    if (!global.deepsiteSessions?.[sessionId]) {
      return NextResponse.json({
        success: false,
        message: "Sessão não encontrada"
      }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso a esta sessão
    const deepSiteSession = global.deepsiteSessions[sessionId];
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: "Acesso negado a esta sessão"
      }, { status: 403 });
    }
    
    // Excluir a sessão
    delete global.deepsiteSessions[sessionId];
    
    return NextResponse.json({
      success: true,
      message: "Sessão excluída com sucesso"
    });
    
  } catch (error) {
    console.error('Erro ao excluir sessão DeepSite:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao excluir sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 