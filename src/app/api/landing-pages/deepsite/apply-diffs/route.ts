// Importando o diff-match-patch para aplicar as diferenças
import { NextRequest, NextResponse } from 'next/server';
import { diff_match_patch } from 'diff-match-patch';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Performance } from '@/lib/performance';
import { consumeDeepSiteCredits, hasEnoughCredits } from '@/lib/deepsite-credits';
import { z } from 'zod';

// Constantes para parser de diff
const SEARCH_START = "<<<<<<< SEARCH";
const DIVIDER = "=======";
const REPLACE_END = ">>>>>>> REPLACE";

// Esquema de validação para o corpo da requisição
const applyDiffSchema = z.object({
  html: z.string().min(1, "HTML é obrigatório"),
  diff: z.string().min(1, "Conteúdo diff é obrigatório"),
  sessionId: z.string().optional()
});

/**
 * Analisa o conteúdo da resposta da IA para blocos SEARCH/REPLACE.
 * @param {string} content - O conteúdo da resposta da IA.
 * @returns {Array<{original: string, updated: string}>} - Array de blocos de diferenças.
 */
function parseDiffBlocks(content: string) {
  const blocks: Array<{original: string, updated: string}> = [];
  const lines = content.split("\n");
  let i = 0;
  
  // Processamento de cada linha para encontrar blocos diff
  while (i < lines.length) {
    if (lines[i].includes(SEARCH_START)) {
      const searchLines = [];
      i++; // Avançar após o marcador SEARCH
      
      // Coletar linhas até encontrar o divisor
      while (i < lines.length && !lines[i].includes(DIVIDER)) {
        searchLines.push(lines[i]);
        i++;
      }
      
      if (i < lines.length && lines[i].includes(DIVIDER)) {
        const replaceLines = [];
        i++; // Avançar após o divisor
        
        // Coletar linhas até encontrar o marcador REPLACE_END
        while (i < lines.length && !lines[i].includes(REPLACE_END)) {
          replaceLines.push(lines[i]);
        i++;
      }
        
        if (i < lines.length && lines[i].includes(REPLACE_END)) {
          // Adicionar bloco de diferença
          blocks.push({
            original: searchLines.join("\n"),
            updated: replaceLines.join("\n")
          });
        }
      }
    }
    i++;
  }
  
  return blocks;
}

/**
 * Aplica os blocos de diferença no HTML.
 * @param {string} html - O HTML original.
 * @param {Array<{original: string, updated: string}>} blocks - Blocos de diferença.
 * @returns {string} - O HTML com as diferenças aplicadas.
 */
function applyDiffBlocks(html: string, blocks: Array<{original: string, updated: string}>) {
  let result = html;
  const dmp = new diff_match_patch();

  // Aumentar o limite de correspondência para ser mais tolerante a pequenas diferenças
  dmp.Match_Threshold = 0.6;
  dmp.Patch_DeleteThreshold = 0.6;
  
  // Contador de blocos aplicados com sucesso
  let successCount = 0;

  // Aplicar cada bloco de diferença
  for (const block of blocks) {
    try {
      // Método 1: Substituição direta (mais precisa, menos tolerante)
      const index = result.indexOf(block.original);
      
      if (index !== -1) {
        // Substituir o bloco original pelo atualizado
        result = result.substring(0, index) + 
                block.updated + 
                result.substring(index + block.original.length);
        
        console.log(`Aplicado bloco ${successCount + 1} por substituição direta`);
        successCount++;
      } 
      else {
        // Método 2: Usar diff-match-patch para correspondência aproximada
        const patches = dmp.patch_make(block.original, block.updated);
        const [patchedText, results] = dmp.patch_apply(patches, result);
        
        // Verificar se pelo menos um patch foi aplicado com sucesso
        console.log(`Patch application results:`, results);
        
        if (results.some((r: boolean) => r)) {
          result = patchedText;
          console.log(`Aplicado patch com diff-match-patch para o bloco ${successCount + 1}`);
          successCount++;
        } else {
          // Método 3: Tentar encontrar correspondências aproximadas usando linhas individuais
          const originalLines = block.original.split('\n');
          const updatedLines = block.updated.split('\n');
          
          // Tentar encontrar a primeira linha para obter um ponto de ancoragem
          if (originalLines.length > 0) {
            const firstLineIndex = result.indexOf(originalLines[0]);
            
            if (firstLineIndex !== -1) {
              // Extrair um contexto aproximado
              const possibleContext = result.substring(
                firstLineIndex, 
                firstLineIndex + block.original.length + 100
              );
              
              // Criar patches baseados neste contexto aproximado
              const contextPatches = dmp.patch_make(possibleContext, 
                possibleContext.replace(originalLines[0], updatedLines[0] || ''));
              
              const [contextPatched, contextResults] = dmp.patch_apply(contextPatches, result);
              
              if (contextResults.some((r: boolean) => r)) {
                result = contextPatched;
                console.log(`Aplicado patch contextual para o bloco ${successCount + 1}`);
                successCount++;
              } else {
                console.warn(`Não foi possível aplicar o bloco ${successCount + 1}`);
                console.warn(`Original:`, block.original);
                console.warn(`Atualizado:`, block.updated);
              }
            } else {
              console.warn(`Não foi possível encontrar a primeira linha do bloco ${successCount + 1}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao aplicar bloco ${successCount + 1}:`, error);
    }
  }

  console.log(`Total de ${successCount} blocos aplicados com sucesso de ${blocks.length}`);
  return result;
}

/**
 * Escapa caracteres especiais para uso em expressões regulares.
 * @param {string} string - String a ser escapada.
 * @returns {string} - String escapada.
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validar se o HTML gerado é válido
 * @param {string} html - O HTML a ser validado
 * @returns {boolean} - Se o HTML é válido
 */
function isValidHtml(html: string): boolean {
  // Implementação básica - pode ser expandida com validação mais robusta
  return html.includes("<html") && 
         html.includes("</html>") && 
         html.includes("<body") && 
         html.includes("</body>");
}

export async function POST(request: NextRequest) {
  const startTime = Performance.now();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      ok: false, 
      message: "Não autorizado" 
    }, { status: 401 });
  }
  
  try {
    // Validar dados de entrada
    const body = await request.json();
    const validationResult = applyDiffSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        ok: false, 
        message: "Dados inválidos", 
        errors: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { html, diff, sessionId } = validationResult.data;
    
    // Verificar disponibilidade de créditos
    const hasCredits = await hasEnoughCredits("APPLY_DIFFS");
    
    if (!hasCredits) {
      return NextResponse.json({ 
        ok: false, 
        message: "Créditos insuficientes para esta operação" 
      }, { status: 403 });
    }
    
    // Analisar blocos de diferença
    const blocks = parseDiffBlocks(diff);
    
    if (blocks.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "Nenhum bloco de diferença encontrado" 
      }, { status: 400 });
    }

    console.log(`Aplicando ${blocks.length} blocos de diferença`);
    
    // Aplicar blocos de diferença
    const modifiedHtml = applyDiffBlocks(html, blocks);
    
    // Validar HTML resultante
    if (!isValidHtml(modifiedHtml)) {
      return NextResponse.json({ 
        ok: false, 
        message: "O HTML resultante não é válido" 
      }, { status: 422 });
    }
    
    // Atualizar sessão se existir
    if (sessionId && global.deepsiteSessions?.[sessionId]) {
      const deepSiteSession = global.deepsiteSessions[sessionId];
      
      // Verificar se o usuário é o proprietário da sessão
      if (deepSiteSession.userId !== session.user.id) {
        return NextResponse.json({ 
          ok: false, 
          message: "Acesso negado a esta sessão" 
        }, { status: 403 });
      }
      
      // Atualizar HTML e timestamp
      deepSiteSession.html = modifiedHtml;
      deepSiteSession.updatedAt = new Date();
    }
    
    // Consumir créditos
    await consumeDeepSiteCredits("APPLY_DIFFS", `Aplicado ${blocks.length} blocos de diferença`);
    
    // Registrar métricas de desempenho
    const endTime = Performance.now();
    Performance.record('apply_diffs', endTime - startTime);
    
    return NextResponse.json({
      ok: true,
      html: modifiedHtml,
      blocks: blocks.length,
      processingTime: (endTime - startTime).toFixed(2),
    });
    
  } catch (error: any) {
    console.error("Erro ao aplicar diferenças:", error);
    
    return NextResponse.json({
      ok: false,
      message: `Erro ao aplicar diferenças: ${error.message}`
    }, { status: 500 });
  }
} 