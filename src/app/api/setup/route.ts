import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db/connection';
import Plan from '@/lib/db/models/Plan';

// Endpoint de setup para popular dados iniciais no banco
export async function GET() {
  try {
    await connectToDB();
    
    // Verificar se já existem planos
    const existingPlans = await Plan.countDocuments();
    
    // Só popula se não houver planos
    if (existingPlans === 0) {
      // Criar planos padrão
      await Plan.create([
        {
          name: 'Básico',
          description: 'Ideal para experimentar a plataforma',
          price: 0,
          credits: 50,
          features: [
            'Acesso a recursos básicos',
            'Geração de texto limitada',
            'Consultas limitadas ao Consultor IA',
            'Sem suporte prioritário'
          ],
          active: true
        },
        {
          name: 'Médio',
          description: 'Para usuários regulares',
          price: 49.90,
          credits: 500,
          features: [
            'Acesso a todos os recursos',
            'Geração de texto ilimitada',
            'Consultas ao Consultor IA',
            'Suporte por email'
          ],
          active: true
        },
        {
          name: 'Avançado',
          description: 'Para usuários profissionais',
          price: 99.90,
          credits: 2000,
          features: [
            'Acesso prioritário a todos os recursos',
            'Geração de texto ilimitada',
            'Consultas prioritárias ao Consultor IA',
            'Suporte prioritário 24/7',
            'Acesso antecipado a novos recursos'
          ],
          active: true
        }
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Dados iniciais populados com sucesso!'
      });
    }
    
    return NextResponse.json({
      success: true, 
      message: 'Setup já realizado anteriormente. Nenhum dado foi modificado.'
    });
    
  } catch (error) {
    console.error('Erro no setup:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao fazer setup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 