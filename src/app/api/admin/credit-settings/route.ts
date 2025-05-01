import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import { 
  getActiveCreditSettings, 
  getCreditSettingByFeatureId, 
  createCreditSetting, 
  updateCreditSetting, 
  toggleCreditSetting 
} from "@/lib/db/models/CreditSettings";

// GET - Listar todas as configurações de créditos
export const GET = withAdminAuth(async () => {
  try {
    // Buscar todas as configurações (não apenas as ativas)
    const settings = await getActiveCreditSettings();
    
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// POST - Criar nova configuração de crédito
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { featureId, featureName, description, creditCost, active } = body;
    
    // Validar dados
    if (!featureId || !featureName || typeof creditCost !== 'number' || creditCost < 0) {
      return NextResponse.json({
        success: false,
        message: "Dados inválidos. Verifique os campos obrigatórios."
      }, { status: 400 });
    }
    
    // Verificar se já existe configuração com este featureId
    const existingSetting = await getCreditSettingByFeatureId(featureId);
    
    if (existingSetting) {
      return NextResponse.json({
        success: false,
        message: `Já existe uma configuração com o ID "${featureId}"`
      }, { status: 409 });
    }
    
    // Criar nova configuração
    const setting = await createCreditSetting({
      featureId,
      featureName,
      description: description || '',
      creditCost,
      active: active !== undefined ? active : true
    });
    
    return NextResponse.json({
      success: true,
      setting
    });
  } catch (error) {
    console.error('Erro ao criar configuração de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao criar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// PUT - Atualizar uma configuração de créditos existente (admin)
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const featureId = url.searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json({
        success: false,
        message: "ID da funcionalidade não informado"
      }, { status: 400 });
    }
    
    // Verificar se a configuração existe
    const existingSetting = await getCreditSettingByFeatureId(featureId);
    
    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        message: "Configuração não encontrada"
      }, { status: 404 });
    }
    
    const body = await req.json();
    
    // Atualizar a configuração
    const updatedSetting = await updateCreditSetting(featureId, {
      featureName: body.featureName,
      description: body.description,
      creditCost: body.creditCost,
      active: body.active
    });
    
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

// PATCH - Ativar/desativar uma configuração de créditos (admin)
export const PATCH = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const featureId = url.searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json({
        success: false,
        message: "ID da funcionalidade não informado"
      }, { status: 400 });
    }
    
    // Verificar se a configuração existe
    const existingSetting = await getCreditSettingByFeatureId(featureId);
    
    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        message: "Configuração não encontrada"
      }, { status: 404 });
    }
    
    const body = await req.json();
    
    if (body.active === undefined) {
      return NextResponse.json({
        success: false,
        message: "O status de ativação (active) deve ser informado"
      }, { status: 400 });
    }
    
    // Ativar/desativar a configuração
    const updatedSetting = await toggleCreditSetting(featureId, body.active);
    
    return NextResponse.json({
      success: true,
      setting: updatedSetting
    });
  } catch (error) {
    console.error('Erro ao ativar/desativar configuração de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao ativar/desativar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}); 