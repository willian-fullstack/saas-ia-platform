import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeOptions } from '../deepsite/utils';
import sanitizeHtml from 'sanitize-html';

// Obter uma landing page específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Buscar a landing page
    const landingPage = await prisma.landingPage.findUnique({
      where: {
        id,
      },
    });
    
    // Verificar se a landing page existe
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 });
    }
    
    // Verificar se o usuário é o dono da landing page
    if (landingPage.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    return NextResponse.json(landingPage);
    
  } catch (error: any) {
    console.error('Erro ao obter landing page:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// Atualizar uma landing page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Buscar a landing page
    const existingLandingPage = await prisma.landingPage.findUnique({
      where: {
        id,
      },
    });
    
    // Verificar se a landing page existe
    if (!existingLandingPage) {
      return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 });
    }
    
    // Verificar se o usuário é o dono da landing page
    if (existingLandingPage.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Obter os dados da requisição
    const { title, html, description, tags } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Sanitizar o HTML
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    // Atualizar a landing page
    const updatedLandingPage = await prisma.landingPage.update({
      where: {
        id,
      },
      data: {
        title,
        html: sanitizedHtml,
        description: description || '',
        tags: tags || [],
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      landingPage: {
        id: updatedLandingPage.id,
        title: updatedLandingPage.title,
        description: updatedLandingPage.description,
        createdAt: updatedLandingPage.createdAt,
        updatedAt: updatedLandingPage.updatedAt,
      },
    });
    
  } catch (error: any) {
    console.error('Erro ao atualizar landing page:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// Excluir uma landing page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Buscar a landing page
    const landingPage = await prisma.landingPage.findUnique({
      where: {
        id,
      },
    });
    
    // Verificar se a landing page existe
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 });
    }
    
    // Verificar se o usuário é o dono da landing page
    if (landingPage.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Excluir a landing page
    await prisma.landingPage.delete({
      where: {
        id,
      },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Erro ao excluir landing page:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
} 