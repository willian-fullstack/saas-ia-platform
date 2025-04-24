import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/db/models/User';
import { connectToDB } from '@/lib/db/connection';
import mongoose from 'mongoose';

// Schema de validação para atualização de perfil
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  bio: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional().default(true),
    marketing: z.boolean().optional().default(false),
    updates: z.boolean().optional().default(true),
  }).optional(),
});

// GET - Obter dados do perfil do usuário
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retorna apenas os dados públicos do usuário
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio || '',
        company: user.company || '',
        phone: user.phone || '',
        notifications: user.notifications || {
          email: true,
          marketing: false,
          updates: true
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados do perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados do corpo da requisição
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() }, 
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    await connectToDB();
    
    // Buscar usuário no banco de dados
    const User = mongoose.models.User;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Atualizar dados do usuário
    user.name = result.data.name;
    user.bio = result.data.bio || user.bio;
    user.company = result.data.company || user.company;
    user.phone = result.data.phone || user.phone;
    
    if (result.data.notifications) {
      user.notifications = {
        ...user.notifications || {},
        ...result.data.notifications
      };
    }
    
    await user.save();
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        company: user.company || '',
        phone: user.phone || '',
        notifications: user.notifications || {
          email: true,
          marketing: false,
          updates: true
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 