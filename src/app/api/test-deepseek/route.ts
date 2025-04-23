import { NextResponse } from "next/server";
import { measureExecutionTime, MemoryCache } from "@/lib/performance";

// Definição do tipo para o resultado do teste
interface TestResult {
  status: string;
  message: string;
  keyPreview: string;
  timestamp: string;
  cached?: boolean;
}

// Cache para resultados de testes
const testCache = new MemoryCache<TestResult>();

export async function GET() {
  return await measureExecutionTime(async () => {
    try {
      // Verificar se temos resultado em cache
      const cachedResult = testCache.get('api_test');
      if (cachedResult) {
        return NextResponse.json({
          ...cachedResult,
          cached: true
        });
      }
      
      const apiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API Key não encontrada. Verifique suas variáveis de ambiente.' },
          { status: 500 }
        );
      }
      
      // Não exibimos a chave completa na resposta por segurança
      const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
      
      const result: TestResult = {
        status: 'success',
        message: 'Variável de ambiente DEEPSEEK_API_KEY configurada corretamente',
        keyPreview: maskedKey,
        timestamp: new Date().toISOString()
      };
      
      // Armazenar em cache por 5 minutos (300000ms)
      testCache.set('api_test', result, 300000);
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('Erro no teste de API:', error);
      
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
  }, 'test_deepseek_api');
} 