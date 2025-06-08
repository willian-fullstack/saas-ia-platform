import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createUserCreation } from '@/lib/db/models/UserCreation';
import { getCreditSettingByFeatureId } from '@/lib/db/models/CreditSettings';
import { consumeCredits } from '@/lib/credits';
import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mapeamento de proporções para resoluções compatíveis com OpenAI
const aspectRatioMap = {
  "1:1": { width: 1024, height: 1024 }, // Quadrado
  "16:9": { width: 1792, height: 1024 }, // Paisagem
  "9:16": { width: 1024, height: 1792 }, // Retrato
};

// Tipo para as chaves do mapeamento de proporções
type AspectRatioKey = keyof typeof aspectRatioMap;

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Obter dados da requisição
    const { prompt, style, ratio, addText, noiseMode } = await req.json();
    
    console.log('Dados recebidos:', { prompt, style, ratio, addText, noiseMode });
    
    // Validar dados
    if (!prompt) {
      return NextResponse.json({ success: false, message: 'Descrição da imagem é obrigatória' }, { status: 400 });
    }

    if (!ratio || !aspectRatioMap[ratio as AspectRatioKey]) {
      return NextResponse.json({ success: false, message: 'Proporção inválida' }, { status: 400 });
    }

    // Verificar e consumir créditos
    const featureId = 'creative-image-generation';
    
    // Buscar configuração de créditos para esta funcionalidade
    const creditSetting = await getCreditSettingByFeatureId(featureId);
    if (!creditSetting) {
      return NextResponse.json({ 
        success: false, 
        message: 'Configuração de créditos não encontrada para esta funcionalidade' 
      }, { status: 400 });
    }

    // Consumir créditos
    const creditResult = await consumeCredits(
      userId, 
      featureId, 
      `Geração de imagem: ${prompt.substring(0, 30)}...`,
      creditSetting.creditCost
    );

    if (!creditResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: creditResult.message || 'Créditos insuficientes para esta operação' 
      }, { status: 400 });
    }

    // Construir prompt completo com base nos parâmetros
    let fullPrompt = `Crie uma imagem de alta qualidade mostrando ${prompt}`;
    
    // Adicionar estilo se fornecido
    if (style && style !== 'realista') {
      fullPrompt += `, no estilo ${style}`;
    }
    
    // Adicionar texto se fornecido
    if (addText) {
      fullPrompt += `, com o texto "${addText}" visível na imagem`;
    }
    
    // Adicionar modo de ruído se ativado
    if (noiseMode) {
      fullPrompt += ", com textura sutil e detalhes granulados";
    }

    // Adicionar instruções para garantir conformidade com as políticas da OpenAI
    fullPrompt += ". A imagem deve ser adequada para todos os públicos, sem conteúdo violento, ofensivo ou adulto.";

    // Obter dimensões com base na proporção
    const { width, height } = aspectRatioMap[ratio as AspectRatioKey];
    
    // Determinar o tamanho correto para a API da OpenAI
    let size: "1024x1024" | "1792x1024" | "1024x1792";
    if (ratio === "1:1") {
      size = "1024x1024";
    } else if (ratio === "16:9") {
      size = "1792x1024";
    } else {
      size = "1024x1792"; // 9:16
    }
    
    console.log('Enviando para OpenAI:', { 
      model: "dall-e-3",
      prompt: fullPrompt,
      size
    });

    try {
      // Chamar a API do OpenAI para gerar a imagem
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size,
        quality: "standard",
        response_format: "url",
      });

      console.log('Resposta da OpenAI:', JSON.stringify(response));

      // Obter URL da imagem gerada
      const imageUrl = response.data[0]?.url;
      
      if (!imageUrl) {
        return NextResponse.json({ 
          success: false, 
          message: 'Falha ao gerar imagem: URL não retornada pela API' 
        }, { status: 500 });
      }

      // Salvar criação do usuário
      const title = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
      
      const creation = await createUserCreation({
        userId,
        title,
        type: 'creative',
        content: {
          prompt: fullPrompt,
          style,
          ratio,
          addText,
          noiseMode,
          imageUrl,
          width,
          height,
          generatedAt: new Date(),
        }
      });

      // Retornar resposta
      return NextResponse.json({
        success: true,
        imageUrl,
        creationId: creation._id,
        remainingCredits: creditResult.remainingCredits,
      });
    } catch (openaiError) {
      console.error('Erro específico da OpenAI:', openaiError);
      
      // Estornar os créditos consumidos em caso de erro
      try {
        // Aqui você implementaria a lógica para estornar os créditos
        // Por exemplo, adicionando os créditos de volta à conta do usuário
        console.log('Estornando créditos devido a erro na API');
      } catch (refundError) {
        console.error('Erro ao estornar créditos:', refundError);
      }
      
      // Retornar erro específico da OpenAI
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao gerar imagem. O conteúdo solicitado pode violar as políticas da OpenAI.',
        error: openaiError instanceof Error ? openaiError.message : 'Erro desconhecido'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido ao gerar imagem',
      error: error instanceof Error ? error.toString() : 'Erro desconhecido'
    }, { status: 500 });
  }
} 