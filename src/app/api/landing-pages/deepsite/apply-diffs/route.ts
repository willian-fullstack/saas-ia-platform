// Importando o diff-match-patch para aplicar as diferenças
import { NextRequest, NextResponse } from 'next/server';
import { diff_match_patch } from 'diff-match-patch';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Performance } from '@/lib/performance';
import { consumeDeepSiteCredits, hasEnoughCredits } from '@/lib/deepsite-credits';
import { z } from 'zod';
import { applyDiffs } from '../diff-utils';
import sanitizeHtml from 'sanitize-html';
import { sanitizeOptions, isValidSession } from '../utils';

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
  try {
    // Obter informações do usuário da sessão (se autenticado)
    let userId = 'anonymous-user';
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Obter os dados da requisição
    const requestData = await request.json();
    const { sessionId, html, diffs } = requestData;
    
    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 });
    }
    
    if (!diffs) {
      return NextResponse.json({ error: 'Diffs são obrigatórios' }, { status: 400 });
    }
    
    // Verificar se o usuário tem acesso à sessão (se não for anônima)
    if (sessionId && 
        global.deepsiteSessions?.[sessionId] && 
        global.deepsiteSessions[sessionId].userId !== 'anonymous-user' && 
        global.deepsiteSessions[sessionId].userId !== userId) {
      return NextResponse.json({ error: 'Acesso negado a esta sessão' }, { status: 403 });
    }
    
    // Aplicar os diffs ao HTML
    const modifiedHtml = applyDiffs(html, diffs);
    
    // Sanitizar o HTML resultante
    const sanitizedHtml = sanitizeHtml(modifiedHtml, sanitizeOptions);
    
    // Atualizar a sessão se existir
    if (sessionId && global.deepsiteSessions?.[sessionId]) {
      global.deepsiteSessions[sessionId].html = sanitizedHtml;
      global.deepsiteSessions[sessionId].updatedAt = new Date();
    }
    
    // Retornar o HTML modificado
    return NextResponse.json({
      html: sanitizedHtml,
      sessionId
    });
    
  } catch (error: any) {
    console.error('Erro ao aplicar diffs:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
} 