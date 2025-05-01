import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import { connectToDB } from "@/lib/db/connection";
import Plan, { IPlan } from '@/lib/db/models/Plan';
import { IUser } from "@/lib/db/models/User";

// GET - Obter um plano específico (somente admin)
export const GET = withAdminAuth(async (req: NextRequest, user: IUser) => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    
    await connectToDB();
    const plan = await Plan.findById(id);
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
});

// PATCH - Atualizar um plano existente (somente admin)
export const PATCH = withAdminAuth(async (req: NextRequest, user: IUser) => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    
    const body = await req.json();
    
    await connectToDB();
    
    // Verificar se o plano existe
    const existingPlan = await Plan.findById(id);
    
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    // Campos que podem ser atualizados
    const updateData: Partial<IPlan> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.credits !== undefined) updateData.credits = body.credits;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.active !== undefined) updateData.active = body.active;
    
    // Atualizar o plano
    const updatedPlan = await Plan.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

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

// DELETE - Excluir (ou desativar) um plano (somente admin)
export const DELETE = withAdminAuth(async (req: NextRequest, user: IUser) => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    
    await connectToDB();
    
    // Verificar se o plano existe
    const existingPlan = await Plan.findById(id);
    
    if (!existingPlan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    // Na verdade, apenas desativamos o plano em vez de removê-lo do banco
    // para manter histórico e para planos que ainda estão em uso
    const updatedPlan = await Plan.findByIdAndUpdate(
      id, 
      { active: false }, 
      { new: true }
    );

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