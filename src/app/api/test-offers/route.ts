import { NextResponse } from 'next/server';
import { measureExecutionTime } from "@/lib/performance";

export async function GET() {
  return await measureExecutionTime(async () => {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API Key não encontrada. Verifique suas variáveis de ambiente.' },
          { status: 500 }
        );
      }
      
      // Testar com dados simulados
      const testData = {
        niche: "Marketing Digital",
        productName: "Método Autoridade Digital",
        productDescription: "Um curso completo que ensina a criar autoridade online e gerar renda com marketing digital",
        targetAudience: "Empreendedores iniciantes e profissionais que desejam iniciar um negócio online",
        pricePoint: "alto",
        bonusCount: 3,
        painPoints: ["Dificuldade em atrair clientes", "Falta de conhecimento técnico", "Investimento alto em marketing sem retorno"],
        includeDiscount: true,
        includeUrgency: true,
        contentType: "resumido"
      };
      
      // Simular a chamada API sem realmente fazer a chamada
      return NextResponse.json({
        status: 'success',
        message: 'Endpoint de teste para a API de ofertas',
        testData: testData,
        apiKeyExists: true,
        apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      });
      
    } catch (error) {
      console.error('Erro no teste de API de ofertas:', error);
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: 'Erro ao testar a configuração da API', details: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao testar a configuração da API' },
        { status: 500 }
      );
    }
  }, 'test_offers_api');
} 