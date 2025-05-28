import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Obter uma sessão específica
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Verificar se a sessão existe
    if (!global.deepsiteSessions || !global.deepsiteSessions[sessionId]) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }
    
    // Obter informações do usuário da sessão (se autenticado)
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Verificar se o usuário é o dono da sessão (apenas se autenticado)
    const sessionData = global.deepsiteSessions[sessionId];
    if (session?.user?.id && sessionData.userId !== 'anonymous-user' && sessionData.userId !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Retornar os dados da sessão
    return NextResponse.json({
      id: sessionId,
      html: sessionData.html,
      title: sessionData.title,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt
    });
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Atualizar uma sessão existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Verificar se a sessão existe
    if (!global.deepsiteSessions || !global.deepsiteSessions[sessionId]) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }
    
    // Obter informações do usuário da sessão (se autenticado)
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Verificar se o usuário é o dono da sessão (apenas se não for anônimo)
    const sessionData = global.deepsiteSessions[sessionId];
    if (session?.user?.id && sessionData.userId !== 'anonymous-user' && sessionData.userId !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Obter os dados da requisição
    const requestData = await request.json();
    const { html, title } = requestData;
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Atualizar a sessão
    global.deepsiteSessions[sessionId] = {
      ...sessionData,
      html,
      title: title || sessionData.title,
      updatedAt: new Date()
    };
    
    // Retornar a sessão atualizada
    return NextResponse.json({
      id: sessionId,
      html: global.deepsiteSessions[sessionId].html,
      title: global.deepsiteSessions[sessionId].title,
      createdAt: global.deepsiteSessions[sessionId].createdAt,
      updatedAt: global.deepsiteSessions[sessionId].updatedAt
    });
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Excluir uma sessão
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Verificar se a sessão existe
    if (!global.deepsiteSessions || !global.deepsiteSessions[sessionId]) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }
    
    // Obter informações do usuário da sessão (se autenticado)
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Verificar se o usuário é o dono da sessão (apenas se não for anônimo)
    const sessionData = global.deepsiteSessions[sessionId];
    if (session?.user?.id && sessionData.userId !== 'anonymous-user' && sessionData.userId !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Excluir a sessão
    delete global.deepsiteSessions[sessionId];
    
    // Retornar sucesso
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir sessão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 