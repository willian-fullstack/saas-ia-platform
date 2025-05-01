import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import { connectToDB } from "@/lib/db/connection";
import Plan from '@/lib/db/models/Plan';

// GET - Obter todos os planos (somente admin)
export const GET = withAdminAuth(async () => {
  try {
    await connectToDB();
    const plans = await Plan.find().sort({ price: 1 });
    
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
});

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
    
    await connectToDB();
    
    // Criar o plano
    const plan = await Plan.create({
      name: body.name,
      description: body.description || '',
      price: body.price,
      credits: body.credits,
      features: body.features || [],
      active: body.active !== false, // Por padrão, o plano é ativo
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