import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/db/connection";
import { updateUserCredits } from "@/lib/db/models/User";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";

// Interface para filtros de usuário
interface UserFilter {
  role?: string;
  email?: { $regex: string, $options: string };
}

// GET - Listar todos os usuários (admin)
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    await connectToDB();
    const User = mongoose.models.User;
    
    // Parâmetros de paginação
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Filtros
    const role = url.searchParams.get('role');
    const email = url.searchParams.get('email');
    const filter: UserFilter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }
    
    // Executar consulta com paginação
    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password') // Excluir senha da resposta
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .exec();
    
    // Calcular paginação
    const totalPages = Math.ceil(totalUsers / limit);
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao listar usuários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// POST - Adicionar créditos a um usuário (admin)
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { userId, credits, reason } = body;
    
    // Validações básicas
    if (!userId || credits === undefined) {
      return NextResponse.json({
        success: false,
        message: "Dados obrigatórios não informados: userId e credits são obrigatórios"
      }, { status: 400 });
    }
    
    if (credits <= 0) {
      return NextResponse.json({
        success: false,
        message: "O valor de créditos deve ser positivo"
      }, { status: 400 });
    }
    
    // Verificar se o usuário existe
    await connectToDB();
    const User = mongoose.models.User;
    const userExists = await User.findById(userId).exec();
    
    if (!userExists) {
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    // Adicionar créditos ao usuário
    const updatedUser = await updateUserCredits(userId, userExists.credits + credits);
    
    // Registrar a operação no histórico de créditos
    await recordCreditAddition(
      userId, 
      credits, 
      reason || 'Créditos adicionados pelo administrador'
    );
    
    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        credits: updatedUser.credits
      },
      creditsAdded: credits
    });
  } catch (error) {
    console.error('Erro ao adicionar créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao adicionar créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// PATCH - Atualizar papel (role) de um usuário (admin)
export const PATCH = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { userId, role } = body;
    
    // Validações básicas
    if (!userId || !role) {
      return NextResponse.json({
        success: false,
        message: "Dados obrigatórios não informados: userId e role são obrigatórios"
      }, { status: 400 });
    }
    
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({
        success: false,
        message: "Papel inválido. Os valores permitidos são: admin, user"
      }, { status: 400 });
    }
    
    // Verificar se o usuário existe
    await connectToDB();
    const User = mongoose.models.User;
    const userExists = await User.findById(userId).exec();
    
    if (!userExists) {
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    // Atualizar o papel do usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password').exec();
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao atualizar papel do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}); 