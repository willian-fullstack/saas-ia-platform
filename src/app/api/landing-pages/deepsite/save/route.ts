import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeOptions as baseSanitizeOptions } from '../utils';
import sanitizeHtml from 'sanitize-html';
import { createLandingPage, ILandingPage } from '@/lib/db/models/LandingPage';
import { saveUserCreation } from '@/lib/db/models/UserCreation';
import mongoose from 'mongoose';

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
    console.log('Iniciando processamento de salvamento de landing page DeepSite');
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('Session user:', session?.user?.email, session?.user?.id);
    
    // Permitir acesso em ambiente de desenvolvimento mesmo sem autenticação
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isDev) {
      console.log('Usuário não autenticado, rejeitando requisição');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const { 
      title, 
      description = '', 
      html, 
      tags = [] 
    } = await request.json();
    
    // Garantir que tags seja um array
    const tagArray: string[] = Array.isArray(tags) ? tags : [];
    
    console.log('Dados recebidos:', { 
      title, 
      descriptionLength: description?.length || 0,
      htmlLength: html?.length || 0,
      tagsCount: tagArray.length
    });
    
    // Validar dados obrigatórios
    if (!title || !html) {
      console.log('Dados obrigatórios faltando');
      return NextResponse.json(
        { error: 'Título e HTML são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Sanitizar HTML
    const sanitizeOptions = {
      ...baseSanitizeOptions,
      allowedTags: [...baseSanitizeOptions.allowedTags, 'script', 'style'],
      allowedAttributes: {
        ...baseSanitizeOptions.allowedAttributes,
        '*': ['class', 'id', 'style']
      }
    };
    
    // Modificar o sanitizeOptions para permitir mais elementos
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    // Usar ID do usuário da sessão ou ID de desenvolvimento
    const userId = session?.user?.id || 'dev-user-id';
    
    try {
      // Criar landing page no banco de dados
      console.log('Criando landing page no MongoDB para usuário:', userId);
      
      // Preparar dados para o MongoDB
      const landingPageData = {
        title,
        description,
        html: sanitizedHtml,
        tags: tagArray,
        userId,
      };
      
      const landingPage = await createLandingPage(landingPageData);
      
      // Garantir que temos um ID válido
      const landingPageId = landingPage._id.toString();
      console.log('Landing page criada com sucesso, ID:', landingPageId);
      
      // Também salvar como uma criação do usuário para aparecer na lista de atividades recentes
      try {
        console.log('Salvando landing page como criação do usuário para atividades recentes');
        
        // Verificar se o userId é válido para o MongoDB
        let validUserId = userId;
        if (userId === 'dev-user-id') {
          console.log('Usando ID de usuário fictício para desenvolvimento');
          validUserId = new mongoose.Types.ObjectId().toString();
        }
        
        // Preparar conteúdo no formato esperado pelo UserCreation
        const userCreationContent = {
          title: title,
          description: description || '',
          result: sanitizedHtml,
          // Incluir informações adicionais que podem ser úteis
          landingPageId,
          tags: tagArray
        };
        
        // Salvar como UserCreation
        const userCreation = await saveUserCreation(
          validUserId,
          title,
          'landing-page',
          userCreationContent
        );
        
        console.log('Criação de usuário salva com sucesso, ID:', userCreation._id);
      } catch (error) {
        console.error('Erro ao salvar como criação de usuário:', error);
        // Continuar mesmo se falhar o salvamento como criação
      }
      
      // Retornar dados da landing page criada
      const response: LandingPageWithFake = {
        id: landingPageId,
        title: landingPage.title,
        description: landingPage.description,
        html: landingPage.html,
        tags: landingPage.tags,
        userId: landingPage.userId,
        createdAt: landingPage.createdAt,
        updatedAt: landingPage.updatedAt,
      };
      
      return NextResponse.json(response);
    } catch (error) {
      console.error('Erro ao salvar landing page:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar landing page' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 