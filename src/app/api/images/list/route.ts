import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getImagesByUserId } from '@/lib/db/models/Image';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar imagens do usuário
    const images = await getImagesByUserId(session.user.id);
    
    // Formatar resposta
    const formattedImages = images.map(image => ({
      id: image._id,
      url: image.path,
      filename: image.filename,
      originalname: image.originalname,
      size: image.size,
      mimetype: image.mimetype,
      createdAt: image.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedImages
    });
    
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao listar imagens: ${error.message}` 
          : 'Erro desconhecido ao listar imagens'
      },
      { status: 500 }
    );
  }
} 