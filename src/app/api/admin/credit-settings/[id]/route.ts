import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import { 
  updateCreditSetting,
  toggleCreditSetting,
  getCreditSettingByFeatureId,
  getCreditSettingById
} from "@/lib/db/models/CreditSettings";
import { IUser } from "@/lib/db/models/User";

// PATCH - Atualizar uma configuração de crédito específica
export const PATCH = withAdminAuth(async (
  req: NextRequest, 
  user: IUser, 
  context?: { params: { id: string } }
) => {
  try {
    // Verificar se temos o contexto e os parâmetros
    if (!context || !context.params || !context.params.id) {
      return NextResponse.json({
        success: false,
        message: "ID da configuração não fornecido"
      }, { status: 400 });
    }

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
});

// DELETE - Excluir uma configuração de crédito
export const DELETE = withAdminAuth(async (
  req: NextRequest, 
  user: IUser, 
  context?: { params: { id: string } }
) => {
  try {
    // Verificar se temos o contexto e os parâmetros
    if (!context || !context.params || !context.params.id) {
      return NextResponse.json({
        success: false,
        message: "ID da configuração não fornecido"
      }, { status: 400 });
    }

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
}); 