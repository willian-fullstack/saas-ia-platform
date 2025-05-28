import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Performance } from '@/lib/performance';

// Referência ao objeto global de sessões (definido no arquivo /api/landing-pages/deepsite/route.ts)
declare global {
  var deepsiteSessions: Record<string, {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    html: string;
    title: string;
    originalLength: number;
    sanitizedLength: number;
  }>;
}

// Inicializar o objeto global de sessões se não existir
if (!global.deepsiteSessions) {
  global.deepsiteSessions = {};
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const startTime = Performance.now();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ 
        ok: false, 
        message: "ID de sessão não fornecido" 
      }, { status: 400 });
    }
    
    // Obter a sessão do armazenamento global
    const deepSiteSession = global.deepsiteSessions?.[sessionId];
    
    if (!deepSiteSession) {
      return NextResponse.json({ 
        ok: false, 
        message: "Sessão não encontrada ou expirada" 
      }, { status: 404 });
    }
    
    // Verificar se o usuário é o proprietário da sessão
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({ 
        ok: false, 
        message: "Acesso negado a esta sessão" 
      }, { status: 403 });
    }
    
    // Atualizar o conteúdo HTML da sessão
    const { html, title } = await request.json();
    
    if (html) {
      deepSiteSession.html = html;
      deepSiteSession.updatedAt = new Date();
    }
    
    if (title) {
      deepSiteSession.title = title;
    }
    
    // Registrar métricas de desempenho
    const endTime = Performance.now();
    Performance.record('session_update', endTime - startTime);
    
    return NextResponse.json({
      ok: true,
      message: "Sessão atualizada com sucesso",
      session: {
        id: deepSiteSession.id,
        title: deepSiteSession.title,
        updatedAt: deepSiteSession.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error("Erro ao atualizar sessão:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao atualizar sessão: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ 
        ok: false, 
        message: "ID de sessão não fornecido" 
      }, { status: 400 });
    }
    
    // Obter a sessão do armazenamento global
    const deepSiteSession = global.deepsiteSessions?.[sessionId];
    
    if (!deepSiteSession) {
      return NextResponse.json({ 
        ok: false, 
        message: "Sessão não encontrada ou expirada" 
      }, { status: 404 });
    }
    
    // Verificar se o usuário é o proprietário da sessão
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({ 
        ok: false, 
        message: "Acesso negado a esta sessão" 
      }, { status: 403 });
    }
    
    return NextResponse.json({
      ok: true,
      session: {
        id: deepSiteSession.id,
        title: deepSiteSession.title,
        html: deepSiteSession.html,
        createdAt: deepSiteSession.createdAt,
        updatedAt: deepSiteSession.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error("Erro ao obter sessão:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao obter sessão: ${error.message}`
    }, { status: 500 });
  }
}

// Endpoint para deletar uma sessão
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({ 
        ok: false, 
        message: "ID de sessão não fornecido" 
      }, { status: 400 });
    }
    
    // Obter a sessão do armazenamento global
    const deepSiteSession = global.deepsiteSessions?.[sessionId];
    
    if (!deepSiteSession) {
      return NextResponse.json({ 
        ok: false, 
        message: "Sessão não encontrada ou expirada" 
      }, { status: 404 });
    }
    
    // Verificar se o usuário é o proprietário da sessão
    if (deepSiteSession.userId !== session.user.id) {
      return NextResponse.json({ 
        ok: false, 
        message: "Acesso negado a esta sessão" 
      }, { status: 403 });
    }
    
    // Remover a sessão
    delete global.deepsiteSessions[sessionId];
    
    return NextResponse.json({
      ok: true,
      message: "Sessão removida com sucesso"
    });
    
  } catch (error: any) {
    console.error("Erro ao remover sessão:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao remover sessão: ${error.message}`
    }, { status: 500 });
  }
} 