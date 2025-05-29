import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeOptions as baseSanitizeOptions } from '../utils';
import sanitizeHtml from 'sanitize-html';
import { createLandingPage } from '@/lib/db/models/LandingPage';

// Interface para o objeto landingPage com propriedade fake opcional
interface LandingPageWithFake {
  id: string;
  title: string;
  description: string | null;
  html: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  fake?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando processamento de salvamento de landing page...');
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('Sessão obtida:', session ? 'Sim' : 'Não');
    console.log('Usuário na sessão:', session?.user?.id || 'Nenhum');
    
    // Usar ID de usuário de desenvolvimento se não houver sessão
    let userId = session?.user?.id || 'dev-user-id';
    let isAuthenticated = !!session?.user || process.env.NODE_ENV === 'development';
    
    console.log('Usuário autenticado:', isAuthenticated ? 'Sim' : 'Não');
    console.log('ID do usuário para salvamento:', userId);
    
    // Verificar se estamos em ambiente de desenvolvimento sem sessão
    if (!session && process.env.NODE_ENV === 'development') {
      console.log('Ambiente de desenvolvimento detectado, continuando sem autenticação');
    } else if (!isAuthenticated) {
      console.error('Tentativa de salvamento sem autenticação');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter os dados da requisição
    const { title, html, sessionId, description, tags } = await request.json();
    
    console.log('Dados recebidos:', { 
      title, 
      sessionId,
      description,
      contentLength: html?.length || 0
    });
    
    if (!title) {
      console.error('Tentativa de salvar landing page sem título');
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }
    
    if (!html) {
      console.error('Tentativa de salvar landing page sem HTML');
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    // Sanitizar o HTML
    const sanitizeOptions = {
      ...baseSanitizeOptions,
      allowVulnerableTags: true // Necessário para permitir tags como style e script
    };
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    let landingPage: LandingPageWithFake;
    
    try {
      console.log(`Iniciando salvamento da landing page no MongoDB para o usuário ${userId}`);
      
      // Salvar no MongoDB
      const newLandingPage = await createLandingPage({
        title,
        html: sanitizedHtml,
        description: description || '',
        tags: tags || [],
        userId,
      });
      
      console.log('Landing page salva com sucesso no MongoDB:', newLandingPage._id);
      
      // Converter o documento do MongoDB para o formato esperado
      landingPage = {
        id: newLandingPage._id.toString(),
        title: newLandingPage.title,
        description: newLandingPage.description || null,
        html: newLandingPage.html,
        tags: newLandingPage.tags,
        userId: newLandingPage.userId,
        createdAt: newLandingPage.createdAt,
        updatedAt: newLandingPage.updatedAt,
      };
    } catch (dbError) {
      console.error('Erro ao salvar no MongoDB:', dbError);
      
      // Criar um objeto simulado apenas em caso de erro
      const now = new Date();
      landingPage = {
        id: `tmp_${Date.now()}`,
        title,
        description: description || '',
        tags: tags || [],
        userId,
        html: sanitizedHtml,
        createdAt: now,
        updatedAt: now,
        fake: true
      };
      
      console.log('Landing page criada em modo fake com ID:', landingPage.id);
    }
    
    // Se houver uma sessão, excluí-la (pois a landing page já foi salva)
    if (sessionId && global.deepsiteSessions?.[sessionId]) {
      delete global.deepsiteSessions[sessionId];
      console.log('Sessão excluída após salvamento:', sessionId);
    }
    
    return NextResponse.json({
      success: true,
      fake: !!landingPage.fake,
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