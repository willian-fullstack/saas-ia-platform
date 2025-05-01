import { NextRequest, NextResponse } from "next/server";
import { getActivePlans, createPlan, updatePlan, getPlanById } from '@/lib/db/models/Plan';
import { withAdminAuth } from "@/lib/middleware/credit-check";

// GET - Obter todos os planos ativos
export async function GET() {
  try {
    // Buscar todos os planos ativos
    const plans = await getActivePlans();
    
    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar planos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// POST - Criar um novo plano (somente admin)
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Validações básicas
    if (!body.name || body.price === undefined || body.credits === undefined) {
      return NextResponse.json({
        success: false,
        message: "Dados obrigatórios não informados: nome, preço e créditos são obrigatórios"
      }, { status: 400 });
    }

    // Criar o plano
    const plan = await createPlan({
      name: body.name,
      description: body.description || '',
      price: body.price,
      credits: body.credits,
      features: body.features || [],
      mercadoPagoId: body.mercadoPagoId,
      active: body.active !== false // Por padrão, o plano é ativo
    });

    return NextResponse.json({
      success: true,
      plan
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao criar plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// PUT - Atualizar um plano existente (somente admin)
export const PUT = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const planId = url.searchParams.get('id');
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        message: "ID do plano não informado"
      }, { status: 400 });
    }
    
    // Verificar se o plano existe
    const existingPlan = await getPlanById(planId);
    
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    const body = await req.json();
    
    // Atualizar o plano
    const updatedPlan = await updatePlan(planId, {
      name: body.name,
      description: body.description,
      price: body.price,
      credits: body.credits,
      features: body.features,
      mercadoPagoId: body.mercadoPagoId,
      active: body.active
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao atualizar plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// DELETE - Desativar um plano (somente admin) - Na verdade é um PATCH para mudar active para false
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const planId = url.searchParams.get('id');
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        message: "ID do plano não informado"
      }, { status: 400 });
    }
    
    // Verificar se o plano existe
    const existingPlan = await getPlanById(planId);
    
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    // Desativar o plano (não remover do banco)
    const updatedPlan = await updatePlan(planId, { active: false });

    return NextResponse.json({
      success: true,
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Erro ao desativar plano:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao desativar plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}); 