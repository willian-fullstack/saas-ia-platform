import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, consumeUserCredits } from "@/lib/db/models/User";
import { getCreditSettingByFeatureId } from "@/lib/db/models/CreditSettings";
import { recordCreditUsage } from "@/lib/db/models/CreditHistory";

// POST - Consumir créditos ao usar uma funcionalidade
export async function POST(req: NextRequest) {
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
    
    // Buscar usuário no banco de dados
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { featureId, description } = body;
    
    if (!featureId) {
      return NextResponse.json({
        success: false,
        message: "ID da funcionalidade não informado"
      }, { status: 400 });
    }
    
    // Verificar o custo da funcionalidade
    const creditSetting = await getCreditSettingByFeatureId(featureId);
    
    if (!creditSetting) {
      return NextResponse.json({
        success: false,
        message: "Funcionalidade não encontrada"
      }, { status: 404 });
    }
    
    if (!creditSetting.active) {
      return NextResponse.json({
        success: false,
        message: "Funcionalidade não está ativa para consumo de créditos"
      }, { status: 400 });
    }
    
    const creditCost = creditSetting.creditCost;
    
    // Verificar se o usuário tem créditos suficientes
    if (user.credits < creditCost) {
      return NextResponse.json({
        success: false,
        message: `Créditos insuficientes. Necessários: ${creditCost}, Disponíveis: ${user.credits}`,
        creditsNeeded: creditCost,
        creditsAvailable: user.credits
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Consumir créditos do usuário
    const updatedUser = await consumeUserCredits(userId, creditCost);
    
    // Registrar o uso de créditos
    await recordCreditUsage(
      userId, 
      creditCost, 
      featureId,
      description || `Uso da funcionalidade: ${creditSetting.featureName}`
    );
    
    return NextResponse.json({
      success: true,
      remainingCredits: updatedUser.credits,
      consumed: creditCost,
      featureName: creditSetting.featureName
    });
  } catch (error) {
    console.error('Erro ao consumir créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao consumir créditos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 