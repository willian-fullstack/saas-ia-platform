import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo foi enviado' }, { status: 400 });
    }
    
    // Validar o tipo de arquivo (apenas imagens)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 });
    }
    
    // Limitar o tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Tamanho máximo do arquivo é 5MB' }, { status: 400 });
    }
    
    // Gerar um nome de arquivo único com timestamp para evitar colisões
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const fileExtension = path.extname(originalName) || '.jpg';
    const fileName = `${timestamp}-${originalName}`;
    
    // Obter o buffer de bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Garantir que o diretório de uploads exista
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log('Diretório de uploads já existe ou erro ao criar:', error);
    }
    
    // Caminho para salvar o arquivo
    const filePath = path.join(uploadDir, fileName);
    
    console.log(`Salvando imagem em: ${filePath}`);
    
    // Salvar o arquivo
    await writeFile(filePath, buffer);
    
    // Verificar se o arquivo foi salvo corretamente
    if (!fs.existsSync(filePath)) {
      throw new Error('Falha ao salvar o arquivo no servidor');
    }
    
    // Retornar informações sobre o arquivo
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      file: {
        name: fileName,
        originalName: originalName,
        size: file.size,
        type: file.type,
        url: fileUrl,
        // Incluir instruções HTML para facilitar a inclusão da imagem
        htmlTag: `<img src="${fileUrl}" alt="${originalName}" class="responsive-image" />`,
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao processar upload de imagem:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// Configurar o tamanho máximo aceitável de arquivo
export const config = {
  api: {
    bodyParser: false,
  },
}; 