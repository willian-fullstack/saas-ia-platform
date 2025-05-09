import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Endpoint para revalidar o cache
export async function POST(request: NextRequest) {
  try {
    // Extrair parâmetros da URL
    const path = request.nextUrl.searchParams.get('path');
    const secret = request.nextUrl.searchParams.get('secret');
    
    // Verificar segredo para autorização
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ success: false, message: 'Token de revalidação inválido' }, { status: 401 });
    }
    
    // Verificar se o caminho foi fornecido
    if (!path) {
      return NextResponse.json({ success: false, message: 'Caminho não especificado' }, { status: 400 });
    }
    
    // Revalidar o caminho especificado
    revalidatePath(path);
    
    return NextResponse.json({ 
      success: true, 
      revalidated: true, 
      path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao revalidar cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao revalidar cache'
      }, 
      { status: 500 }
    );
  }
} 