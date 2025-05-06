import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { getUserById } from "@/lib/db/models/User";
import { 
  updateCreditSetting,
  toggleCreditSetting,
  getCreditSettingByFeatureId,
  getCreditSettingById
} from "@/lib/db/models/CreditSettings";
import { IUser } from "@/lib/db/models/User";

async function checkAdminAuth(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return {
        allowed: false,
        response: NextResponse.json({
          success: false,
          message: "Não autorizado: Usuário não autenticado"
        }, { status: 401 })
      };
    }
    
    const userId = token.sub;
    const user = await getUserById(userId);
    
    if (!user) {
      return {
        allowed: false,
        response: NextResponse.json({
          success: false,
          message: "Não autorizado: Usuário não encontrado"
        }, { status: 401 })
      };
    }
    
    if (user.role !== 'admin') {
      return {
        allowed: false,
        response: NextResponse.json({
          success: false,
          message: "Não autorizado: Acesso permitido apenas para administradores"
        }, { status: 403 })
      };
    }
    
    return { allowed: true, user };
  } catch (error) {
    console.error('Erro de autorização admin:', error);
    return {
      allowed: false,
      response: NextResponse.json({
        success: false,
        message: `Erro de autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }, { status: 500 })
    };
  }
}

// PATCH - Atualizar uma configuração de crédito específica
export async function PATCH(
  req: NextRequest, 
  context: { params: { id: string } }
) {
  // Verificação de autenticação
  const authResult = await checkAdminAuth(req);
  if (!authResult.allowed) {
    return authResult.response;
  }

  try {
    const id = context.params.id;
    const body = await req.json();
    
    // Verificar se o ID é um ObjectId válido do MongoDB
    let existingSetting;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Buscar por _id
      existingSetting = await getCreditSettingById(id);
    } else {
      // Buscar por featureId
      existingSetting = await getCreditSettingByFeatureId(id);
    }
    
    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        message: "Configuração não encontrada"
      }, { status: 404 });
    }
    
    // Se estiver apenas ativando/desativando
    if (body.active !== undefined && Object.keys(body).length === 1) {
      const updatedSetting = await toggleCreditSetting(existingSetting.featureId, body.active);
      
      return NextResponse.json({
        success: true,
        setting: updatedSetting
      });
    }
    
    // Atualização completa ou parcial
    const { featureName, description, creditCost } = body;
    const updateData: Record<string, unknown> = {};
    
    if (featureName !== undefined) updateData.featureName = featureName;
    if (description !== undefined) updateData.description = description;
    if (creditCost !== undefined && typeof creditCost === 'number' && creditCost >= 0) {
      updateData.creditCost = creditCost;
    }
    
    const updatedSetting = await updateCreditSetting(existingSetting.featureId, updateData);
    
    return NextResponse.json({
      success: true,
      setting: updatedSetting
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao atualizar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// DELETE - Excluir uma configuração de crédito
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  // Verificação de autenticação
  const authResult = await checkAdminAuth(req);
  if (!authResult.allowed) {
    return authResult.response;
  }

  try {
    const id = context.params.id;
    
    // Verificar se o ID é um ObjectId válido do MongoDB
    let existingSetting;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Buscar por _id
      existingSetting = await getCreditSettingById(id);
    } else {
      // Buscar por featureId
      existingSetting = await getCreditSettingByFeatureId(id);
    }
    
    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        message: "Configuração não encontrada"
      }, { status: 404 });
    }
    
    // "Excluir" - marcar como inativa para manter histórico
    await toggleCreditSetting(existingSetting.featureId, false);
    
    return NextResponse.json({
      success: true,
      message: "Configuração excluída com sucesso"
    });
  } catch (error) {
    console.error('Erro ao excluir configuração de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao excluir configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 