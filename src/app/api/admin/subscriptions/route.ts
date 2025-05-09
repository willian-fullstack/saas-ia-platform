import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDB } from "@/lib/db/connection";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Plan from "@/lib/db/models/Plan";

/**
 * Endpoint para listar assinaturas para administradores
 * GET - Retorna todas as assinaturas no sistema, com opções de filtragem
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    // Verificar se o usuário é administrador
    await connectToDB();
    const adminUser = await User.findById(token.sub);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: "Permissão negada. Apenas administradores podem acessar este recurso."
      }, { status: 403 });
    }
    
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Construir filtro de consulta
    const filter: any = {};
    
    if (status && ['active', 'pending', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    // Buscar assinaturas com população de usuário e plano
    const subscriptions = await Subscription.find(filter)
      .populate({
        path: 'userId',
        model: User,
        select: '_id name email'
      })
      .populate({
        path: 'planId',
        model: Plan,
        select: '_id name price credits'
      })
      .sort({ updatedAt: -1 })
      .limit(limit);
    
    // Processar resultados para formato adequado
    const processedSubscriptions = subscriptions.map(sub => {
      const subscription = sub.toObject();
      
      // Adicionar informações do usuário em um campo separado para maior clareza na UI
      if (subscription.userId && typeof subscription.userId !== 'string') {
        subscription.user = {
          _id: subscription.userId._id,
          name: subscription.userId.name,
          email: subscription.userId.email
        };
      }
      
      return subscription;
    });
    
    // Retornar assinaturas
    return NextResponse.json({
      success: true,
      subscriptions: processedSubscriptions,
      total: processedSubscriptions.length
    });
  } catch (error) {
    console.error("Erro ao listar assinaturas:", error);
    return NextResponse.json({
      success: false,
      message: `Erro ao listar assinaturas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 