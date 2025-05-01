import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById } from "@/lib/db/models/User";
import { getCreditSettingByFeatureId } from "@/lib/db/models/CreditSettings";

// GET - Verificar se o usuário tem créditos suficientes para uma funcionalidade
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
    
    // Obter parâmetros da requisição
    const url = new URL(req.url);
    const featureId = url.searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json({
        success: false,
        message: "ID da funcionalidade não informado"
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
    
    // Verificar configuração de créditos da funcionalidade
    const creditSetting = await getCreditSettingByFeatureId(featureId);
    
    if (!creditSetting) {
      return NextResponse.json({
        success: false,
        message: "Funcionalidade não encontrada"
      }, { status: 404 });
    }
    
    if (!creditSetting.active) {
      return NextResponse.json({
        success: true,
        hasEnough: true,
        message: "Esta funcionalidade não consome créditos"
      });
    }
    
    const required = creditSetting.creditCost;
    const available = user.credits;
    const hasEnough = available >= required;
    
    return NextResponse.json({
      success: true,
      hasEnough,
      required,
      available,
      message: hasEnough 
        ? "Créditos suficientes" 
        : `Créditos insuficientes. Necessários: ${required}, Disponíveis: ${available}`
    });
  } catch (error) {
    console.error('Erro ao verificar créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao verificar créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 