import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { deleteUserCreation } from '@/lib/db/models/UserCreation';

// DELETE - Excluir uma criação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Excluir a criação
    const userId = session.user.id;
    await deleteUserCreation(params.id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 