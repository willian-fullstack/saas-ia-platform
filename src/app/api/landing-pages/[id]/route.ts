import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeOptions as baseSanitizeOptions } from '../deepsite/utils';
import sanitizeHtml from 'sanitize-html';
import { getLandingPageById, updateLandingPage, deleteLandingPage, ILandingPage } from '@/lib/db/models/LandingPage';
import mongoose from 'mongoose';

// Obter uma landing page específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDev) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    console.log(`Buscando landing page com ID: ${id}`);
    
    // Verificar se o ID é válido para MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de landing page inválido' }, { status: 400 });
    }
    
    // Buscar a landing page
    const landingPage = await getLandingPageById(id);
    
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso à landing page
    if (landingPage.userId !== session?.user?.id && landingPage.userId !== 'dev-user-id' && !isDev) {
      return NextResponse.json({ error: 'Não autorizado a acessar esta landing page' }, { status: 403 });
    }
    
    // Converter o documento para o formato esperado
    const formattedLandingPage = {
      id: landingPage._id?.toString() || id,
      title: landingPage.title,
      description: landingPage.description || '',
      html: landingPage.html,
      tags: landingPage.tags || [],
      createdAt: landingPage.createdAt.toISOString(),
      updatedAt: landingPage.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ landingPage: formattedLandingPage });
    
  } catch (error) {
    console.error('Erro ao buscar landing page:', error);
    return NextResponse.json({ error: 'Erro ao buscar landing page' }, { status: 500 });
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
    
    // Verificar se o ID é válido para MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de landing page inválido' }, { status: 400 });
    }
    
    // Buscar a landing page
    const existingLandingPage = await getLandingPageById(id);
    
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
    const sanitizeOptions = {
      ...baseSanitizeOptions,
      allowVulnerableTags: true // Necessário para permitir tags como style e script
    };
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    // Atualizar a landing page
    const updatedLandingPage = await updateLandingPage(id, {
      title,
      html: sanitizedHtml,
      description: description || '',
      tags: tags || [],
    });
    
    if (!updatedLandingPage) {
      return NextResponse.json({ error: 'Erro ao atualizar landing page' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      landingPage: {
        id: updatedLandingPage._id?.toString() || id,
        title: updatedLandingPage.title,
        description: updatedLandingPage.description || '',
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
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDev) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    console.log(`Excluindo landing page com ID: ${id}`);
    
    // Verificar se o ID é válido para MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de landing page inválido' }, { status: 400 });
    }
    
    // Buscar a landing page
    const landingPage = await getLandingPageById(id);
    
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso à landing page
    if (landingPage.userId !== session?.user?.id && landingPage.userId !== 'dev-user-id' && !isDev) {
      return NextResponse.json({ error: 'Não autorizado a excluir esta landing page' }, { status: 403 });
    }
    
    // Excluir a landing page
    const success = await deleteLandingPage(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Erro ao excluir landing page' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Erro ao excluir landing page:', error);
    return NextResponse.json({ error: 'Erro ao excluir landing page' }, { status: 500 });
  }
} 