import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeOptions } from '../utils';
import sanitizeHtml from 'sanitize-html';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter os dados da requisição
    const { title, html, sessionId, description, tags } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Sanitizar o HTML
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    // Salvar a landing page no banco de dados
    const landingPage = await prisma.landingPage.create({
      data: {
        title,
        html: sanitizedHtml,
        description: description || '',
        tags: tags || [],
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Se houver uma sessão, excluí-la (pois a landing page já foi salva)
    if (sessionId && global.deepsiteSessions?.[sessionId]) {
      delete global.deepsiteSessions[sessionId];
    }
    
    return NextResponse.json({
      success: true,
      landingPage: {
        id: landingPage.id,
        title: landingPage.title,
        description: landingPage.description,
        createdAt: landingPage.createdAt,
        updatedAt: landingPage.updatedAt,
      },
    });
    
  } catch (error: any) {
    console.error('Erro ao salvar landing page:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
} 