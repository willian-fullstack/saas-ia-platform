import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById } from "@/lib/db/models/User";
import { getUserCreditHistory } from "@/lib/db/models/CreditHistory";
import { ICreditHistory } from "@/lib/db/models/CreditHistory";
import mongoose from "mongoose";

// Interface para resposta da API de balanço de créditos
interface CreditBalanceResponse {
  success: boolean;
  credits: number;
  history?: ICreditHistory[];
  pagination?: {
    page: number;
    limit: number;
    skip: number;
  };
}

// GET - Obter o saldo de créditos do usuário
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
    
    const userId = token.sub;
    
    // Validar formato do ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn(`ID de usuário inválido: ${userId}`);
      return NextResponse.json({
        success: false,
        message: "ID de usuário inválido"
      }, { status: 400 });
    }
    
    // Buscar usuário no banco de dados
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    // Parâmetros de paginação para histórico
    const url = new URL(req.url);
    const includeHistory = url.searchParams.get('history') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Preparar resposta
    const response: CreditBalanceResponse = {
      success: true,
      credits: user.credits
    };
    
    // Se solicitado, incluir histórico de créditos
    if (includeHistory) {
      try {
        response.history = await getUserCreditHistory(userId, limit, skip);
        response.pagination = {
          page,
          limit,
          skip
        };
      } catch (historyError) {
        console.error("Erro ao obter histórico de créditos:", historyError);
        // Não falha a requisição, apenas loga o erro e continua sem o histórico
      }
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar saldo de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar saldo de créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 