import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createImage } from '@/lib/db/models/Image';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Processar o formulário multipart
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Nenhuma imagem enviada' },
        { status: 400 }
      );
    }
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'O arquivo enviado não é uma imagem válida' },
        { status: 400 }
      );
    }
    
    // Limitar tamanho da imagem (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'A imagem excede o tamanho máximo de 5MB' },
        { status: 400 }
      );
    }
    
    try {
      // Gerar um nome de arquivo único
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${uuidv4()}.${fileExtension}`;
      
      // Garantir que o diretório de uploads exista
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.promises.mkdir(uploadDir, { recursive: true });
      
      // Caminho completo para o arquivo
      const filePath = path.join(uploadDir, filename);
      
      // Ler o conteúdo do arquivo como array buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Salvar o arquivo no sistema de arquivos
      await fs.promises.writeFile(filePath, buffer);
      
      // URL pública para o arquivo
      const publicPath = `/uploads/${filename}`;
      
      // Salvar metadados da imagem no banco de dados
      const savedImage = await createImage({
        filename,
        originalname: file.name,
        mimetype: file.type,
        path: publicPath,
        size: file.size,
        userId: session.user.id,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Imagem enviada com sucesso',
        data: {
          id: savedImage._id,
          url: publicPath,
          filename: savedImage.filename,
          originalname: savedImage.originalname,
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar o arquivo:', error);
      return NextResponse.json(
        { success: false, message: 'Erro ao salvar a imagem' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `Erro no upload: ${error.message}` 
          : 'Erro desconhecido no upload'
      },
      { status: 500 }
    );
  }
} 