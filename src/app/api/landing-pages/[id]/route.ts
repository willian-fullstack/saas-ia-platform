import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sanitizeHtml from 'sanitize-html';
import { getLandingPageById, updateLandingPage, deleteLandingPage } from '@/lib/db/models/LandingPage';
import mongoose from 'mongoose';

// Opções de sanitização para HTML
const sanitizeOptions = {
  allowedTags: [
    'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'div', 'span', 'article', 'section', 'header', 'footer', 'nav', 'main',
    'a', 'img', 'picture', 'figure', 'figcaption', 'blockquote', 'cite',
    'pre', 'code', 'em', 'strong', 'b', 'i', 'u', 'small', 'sub', 'sup',
    'form', 'input', 'textarea', 'button', 'select', 'option', 'label',
    'iframe', 'video', 'audio', 'source', 'track',
    'canvas', 'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  ],
  allowedAttributes: {
    '*': ['id', 'class', 'style', 'data-*'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    'video': ['src', 'controls', 'width', 'height', 'autoplay', 'muted', 'loop'],
    'source': ['src', 'type'],
    'input': ['type', 'name', 'value', 'placeholder', 'required', 'checked', 'disabled'],
    'button': ['type', 'name', 'value', 'disabled'],
    'meta': ['name', 'content', 'charset', 'viewport'],
    'link': ['rel', 'href', 'type'],
    'script': ['src', 'type', 'async', 'defer'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

// Obter uma landing page específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user?.id && !isDev) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const id = params.id;
    
    // Validar ID formato MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: "ID de landing page inválido"
      }, { status: 400 });
    }
    
    // Buscar landing page
    const landingPage = await getLandingPageById(id);
    
    if (!landingPage) {
      return NextResponse.json({
        success: false,
        message: "Landing page não encontrada"
      }, { status: 404 });
    }
    
    // Verificar se o usuário tem permissão para acessar esta landing page
    // Em desenvolvimento, permitir acesso a qualquer landing page
    if (!isDev && landingPage.userId !== session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Você não tem permissão para acessar esta landing page"
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: landingPage
    });
    
  } catch (error) {
    console.error('Erro ao buscar landing page:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar landing page: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
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
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user?.id && !isDev) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const id = params.id;
    console.log(`Iniciando atualização da landing page ID: ${id}`);
    
    // Validar ID formato MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`ID inválido: ${id}`);
      return NextResponse.json({
        success: false,
        message: "ID de landing page inválido"
      }, { status: 400 });
    }
    
    // Obter dados do corpo da requisição
    const { title, description, html, tags } = await request.json();
    console.log(`Recebidos dados para atualização: title=${title ? 'presente' : 'ausente'}, description=${description ? 'presente' : 'ausente'}, html=${html ? 'presente' : 'ausente'}, tags=${tags ? 'presentes' : 'ausentes'}`);
    
    // Sanitizar o HTML para segurança
    const sanitizedHtml = html ? sanitizeHtml(html, sanitizeOptions) : undefined;
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (html !== undefined) updateData.html = sanitizedHtml;
    if (tags !== undefined) updateData.tags = tags;
    
    console.log(`Campos a serem atualizados: ${Object.keys(updateData).join(', ')}`);
    
    // Verificar se a landing page existe e se o usuário tem permissão
    const existingLandingPage = await getLandingPageById(id);
    if (!existingLandingPage) {
      console.error(`Landing page ID ${id} não encontrada`);
      return NextResponse.json({
        success: false,
        message: "Landing page não encontrada"
      }, { status: 404 });
    }
    
    // Em ambiente de desenvolvimento, permitir edição de qualquer landing page
    if (!isDev && existingLandingPage.userId !== session?.user?.id) {
      console.error(`Usuário ${session?.user?.id} não tem permissão para editar landing page ${id} pertencente ao usuário ${existingLandingPage.userId}`);
      return NextResponse.json({
        success: false,
        message: "Você não tem permissão para editar esta landing page"
      }, { status: 403 });
    }
    
    // Atualizar landing page
    console.log(`Enviando atualização para o banco de dados...`);
    const updatedLandingPage = await updateLandingPage(id, updateData);
    
    if (!updatedLandingPage) {
      console.error(`Falha ao atualizar landing page ${id} no banco de dados`);
      return NextResponse.json({
        success: false,
        message: "Erro ao atualizar landing page no banco de dados"
      }, { status: 500 });
    }
    
    console.log(`Landing page ${id} atualizada com sucesso. Título: ${updatedLandingPage.title}`);
    
    return NextResponse.json({
      success: true,
      data: updatedLandingPage,
      message: "Landing page atualizada com sucesso"
    });
    
  } catch (error) {
    console.error('Erro ao atualizar landing page:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao atualizar landing page: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
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
    
    if (!session?.user?.id && !isDev) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const { id } = params;
    console.log(`Excluindo landing page com ID: ${id}`);
    
    // Verificar se o ID é válido para MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: "ID de landing page inválido"
      }, { status: 400 });
    }
    
    // Buscar a landing page
    const landingPage = await getLandingPageById(id);
    
    if (!landingPage) {
      return NextResponse.json({
        success: false,
        message: "Landing page não encontrada"
      }, { status: 404 });
    }
    
    // Verificar se o usuário tem acesso à landing page
    // Em ambiente de desenvolvimento, permitir exclusão de qualquer landing page
    if (!isDev && landingPage.userId !== session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: "Você não tem permissão para excluir esta landing page"
      }, { status: 403 });
    }
    
    // Excluir a landing page
    const success = await deleteLandingPage(id);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        message: "Erro ao excluir landing page"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Landing page excluída com sucesso"
    });
    
  } catch (error) {
    console.error('Erro ao excluir landing page:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao excluir landing page: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 