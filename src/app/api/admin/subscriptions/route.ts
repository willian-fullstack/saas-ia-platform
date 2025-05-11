import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDB } from "@/lib/db/connection";
import { getSubscriptionModel, ISubscription } from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
import Plan from "@/lib/db/models/Plan";
import { Schema } from "mongoose";

// Interface para representar o usuário populado
interface PopulatedUser {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
}

// Interface para representar o plano populado
interface PopulatedPlan {
  _id: Schema.Types.ObjectId;
  name: string;
  price: number;
  credits: number;
}

// Interface para representar a assinatura populada
interface PopulatedSubscription extends Omit<ISubscription, 'userId' | 'planId'> {
  userId: PopulatedUser;
  planId: PopulatedPlan;
  _id: Schema.Types.ObjectId;
  __v: number;
}

// Interface para o formato processado para UI
interface ProcessedSubscription extends ISubscription {
  _id: Schema.Types.ObjectId;
  __v: number;
  user?: {
    _id: Schema.Types.ObjectId;
    name: string;
    email: string;
  };
}

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
    
    // Buscar o modelo de Subscription
    const Subscription = await getSubscriptionModel();
    
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
    const processedSubscriptions = subscriptions.map((sub) => {
      const subscription = sub.toObject() as PopulatedSubscription;
      
      // Criar objeto processado para UI
      const processed: ProcessedSubscription = {
        ...subscription,
        userId: subscription.userId._id, // Convertendo de volta para o formato original
        planId: subscription.planId._id, // Convertendo de volta para o formato original
      };
      
      // Adicionar informações do usuário em um campo separado para maior clareza na UI
      processed.user = {
        _id: subscription.userId._id,
        name: subscription.userId.name,
        email: subscription.userId.email
      };
      
      return processed;
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