import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/credit-check";
import { getCreditUsageStats } from "@/lib/db/models/CreditHistory";
import { IUser } from "@/lib/db/models/User";

// GET - Obter estatísticas de uso de crédito
export const GET = withAdminAuth(async (req: NextRequest, user: IUser) => {
  try {
    // Buscar estatísticas de uso de crédito
    const { usageStats, totalUsage } = await getCreditUsageStats();
    
    return NextResponse.json({
      success: true,
      usageStats,
      totalUsage
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso de créditos:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}); 