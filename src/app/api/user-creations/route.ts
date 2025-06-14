import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { z } from 'zod';
import { 
  CreationType,
  saveUserCreation, 
  getUserCreations, 
  getUserCreationsByType,
  getUserCreationById,
  deleteUserCreation
} from '@/lib/db/models/UserCreation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Validação do corpo da requisição para salvar uma criação
const saveCreationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  type: z.enum(['copywriting', 'landing-page', 'offer', 'creative', 'video', 'consultant']),
  content: z.record(z.unknown())
});

// GET - Obter criações do usuário
export async function GET(request: NextRequest) {
  try {
    console.log('API User Creations: Requisição GET recebida');
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('API User Creations: Sessão:', session?.user?.email, session?.user?.id);
    
    // Permitir acesso em ambiente de desenvolvimento mesmo sem autenticação
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!session?.user?.email || !session?.user?.id) {
      console.log('API User Creations: Usuário não autenticado');
      
      // Em ambiente de desenvolvimento, podemos permitir acesso mesmo sem autenticação
      if (isDev) {
        console.log('API User Creations: Ambiente de desenvolvimento, continuando sem autenticação');
      } else {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    // Obter parâmetros da URL
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');
    
    console.log('API User Creations: Parâmetros:', { type, id });
    
    // Verificar se precisa buscar por ID
    if (id) {
      try {
        const creation = await getUserCreationById(id);
        
        // Verificar se a criação pertence ao usuário
        if (!creation || (creation.userId.toString() !== session?.user?.id && !isDev)) {
          console.log('API User Creations: Criação não encontrada ou não pertence ao usuário');
          return NextResponse.json({ error: 'Criação não encontrada' }, { status: 404 });
        }
        
        console.log('API User Creations: Criação encontrada:', creation._id);
        return NextResponse.json({ creation });
      } catch (error: unknown) {
        console.error('Erro ao buscar criação por ID:', error);
        return NextResponse.json({ error: 'ID de criação inválido' }, { status: 400 });
      }
    }
    
    try {
      // Buscar criações do usuário
      const userId = session?.user?.id || 'dev-user-id';
      let creations;
      
      console.log('API User Creations: Buscando criações para usuário:', userId);
      
      if (type) {
        // Verificar se o tipo é válido
        const validTypes = ['copywriting', 'landing-page', 'offer', 'creative', 'video', 'consultant'];
        if (!validTypes.includes(type)) {
          return NextResponse.json({ error: 'Tipo de criação inválido' }, { status: 400 });
        }
        
        creations = await getUserCreationsByType(userId, type as CreationType);
      } else {
        creations = await getUserCreations(userId);
      }
      
      console.log(`API User Creations: ${creations.length} criações encontradas`);
      
      // Log detalhado para debugging
      if (creations.length > 0) {
        console.log('API User Creations: Tipos encontrados:', creations.map(c => c.type).reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}));
        
        // Verificar especificamente landing pages
        const landingPages = creations.filter(c => c.type === 'landing-page');
        console.log(`API User Creations: ${landingPages.length} landing pages encontradas`);
        
        if (landingPages.length > 0) {
          console.log('API User Creations: Exemplo de landing page:', {
            id: landingPages[0]._id.toString(),
            title: landingPages[0].title,
            type: landingPages[0].type,
            contentKeys: Object.keys(landingPages[0].content || {})
          });
        }
      }
      
      return NextResponse.json({ creations });
    } catch (error) {
      console.error('Erro ao buscar criações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar criações' }, 
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

// POST - Salvar uma nova criação
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter corpo da requisição
    const body = await request.json();
    
    // Validar corpo da requisição
    const result = saveCreationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() }, 
        { status: 400 }
      );
    }
    
    try {
      // Salvar a criação
      const userId = session.user.id;
      const { title, type, content } = result.data;
      
      const creation = await saveUserCreation(userId, title, type as CreationType, content);
      
      return NextResponse.json({ creation }, { status: 201 });
    } catch (saveError) {
      console.error('Erro ao salvar criação:', saveError);
      return NextResponse.json(
        { error: 'Erro ao salvar criação' }, 
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

// DELETE - Excluir uma criação
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID da criação a ser excluída
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID da criação é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de criação inválido' }, { status: 400 });
    }
    
    // Excluir a criação
    const userId = session.user.id;
    const result = await deleteUserCreation(id, userId);
    
    if (!result) {
      return NextResponse.json({ error: 'Criação não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 