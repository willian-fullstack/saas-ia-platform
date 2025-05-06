import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById } from "@/lib/db/models/User";
import { getCreditSettingByFeatureId } from "@/lib/db/models/CreditSettings";
import { IUser } from "@/lib/db/models/User";

// Interface para resultado da verificação de créditos
interface CreditCheckResult {
  hasCredits: boolean;
  error?: string;
  requiredCredits?: number;
}

// Tipo para handler de admin atualizado para suportar novos formatos de rotas
type AdminRouteHandler<T = any> = (
  req: NextRequest, 
  user: IUser,
  context: { params: { [key: string]: string } }
) => Promise<T>;

/**
 * Middleware para verificar se o usuário tem créditos suficientes para usar uma funcionalidade
 * @param req Requisição Next.js
 * @param feature ID da funcionalidade que consome créditos
 */
export async function checkCredits(req: NextRequest, feature: string): Promise<CreditCheckResult> {
  try {
    // Verifica se o usuário está autenticado
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return { hasCredits: false, error: "Usuário não autenticado" };
    }
    
    const userId = token.sub;
    
    // Busca o usuário no banco de dados
    const user = await getUserById(userId);
    
    if (!user) {
      return { hasCredits: false, error: "Usuário não encontrado" };
    }
    
    // Verifica se é uma funcionalidade que consome créditos
    const creditSetting = await getCreditSettingByFeatureId(feature);
    
    if (!creditSetting || !creditSetting.active) {
      return { hasCredits: true }; // Se a funcionalidade não requer créditos ou está inativa
    }
    
    const requiredCredits = creditSetting.creditCost;
    
    // Verifica se o usuário tem créditos suficientes
    if (user.credits < requiredCredits) {
      return { 
        hasCredits: false, 
        error: `Créditos insuficientes. Necessários: ${requiredCredits}, Disponíveis: ${user.credits}`,
        requiredCredits
      };
    }
    
    // Usuário tem créditos suficientes
    return { 
      hasCredits: true, 
      requiredCredits 
    };
  } catch (error) {
    console.error('Erro ao verificar créditos:', error);
    return { 
      hasCredits: false, 
      error: `Erro ao verificar créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Middleware de rota para verificar se o usuário tem permissão de administrador
 */
export function withAdminAuth<T = NextResponse>(handler: AdminRouteHandler<T>) {
  return async function(req: NextRequest, context: { params: { [key: string]: string } }): Promise<T> {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      
      if (!token || !token.sub) {
        return NextResponse.json({
          success: false,
          message: "Não autorizado: Usuário não autenticado"
        }, { status: 401 }) as unknown as T;
      }
      
      const userId = token.sub;
      const user = await getUserById(userId);
      
      if (!user) {
        return NextResponse.json({
          success: false,
          message: "Não autorizado: Usuário não encontrado"
        }, { status: 401 }) as unknown as T;
      }
      
      if (user.role !== 'admin') {
        return NextResponse.json({
          success: false,
          message: "Não autorizado: Acesso permitido apenas para administradores"
        }, { status: 403 }) as unknown as T;
      }
      
      // Usuário é admin, prossegue com a execução do handler
      return handler(req, user, context);
    } catch (error) {
      console.error('Erro de autorização admin:', error);
      return NextResponse.json({
        success: false,
        message: `Erro de autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }, { status: 500 }) as unknown as T;
    }
  };
} 