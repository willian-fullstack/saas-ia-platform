import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById } from "@/lib/db/models/User";
import { getUserCreditHistory } from "@/lib/db/models/CreditHistory";
import { ICreditHistory } from "@/lib/db/models/CreditHistory";

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
    // Verificar autenticação com mais logs para diagnóstico
    console.log("Iniciando verificação de autenticação na API de créditos");
    
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    });
    
    console.log("Token obtido:", token ? "Token válido" : "Token ausente");
    
    if (!token || !token.sub) {
      console.log("Falha de autenticação: Token inválido ou ausente");
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const userId = token.sub;
    console.log("Usuário autenticado, ID:", userId);
    
    // Buscar usuário no banco de dados
    const user = await getUserById(userId);
    
    if (!user) {
      console.log("Usuário não encontrado no banco de dados:", userId);
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    console.log("Usuário encontrado:", user.email);
    
    // Parâmetros de paginação para histórico
    const url = new URL(req.url);
    const includeHistory = url.searchParams.get('history') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Preparar resposta
    const response: CreditBalanceResponse = {
      success: true,
      credits: user.credits || 0 // Garantir que não seja undefined
    };
    
    // Se solicitado, incluir histórico de créditos
    if (includeHistory) {
      response.history = await getUserCreditHistory(userId, limit, skip);
      response.pagination = {
        page,
        limit,
        skip
      };
    }
    
    console.log("Resposta de créditos enviada com sucesso");
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar saldo de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar saldo de créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 