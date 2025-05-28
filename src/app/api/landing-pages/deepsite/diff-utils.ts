import { diff_match_patch } from 'diff-match-patch';

// Constantes para os blocos de diff
export const SEARCH_START = "<<<<<<< SEARCH";
export const DIVIDER = "=======";
export const REPLACE_END = ">>>>>>> REPLACE";

/**
 * Analisa o conteúdo da resposta da IA para blocos SEARCH/REPLACE.
 * @param {string} content - O conteúdo da resposta da IA.
 * @returns {Array<{original: string, updated: string}>} - Array de blocos de diff.
 */
export function parseDiffBlocks(content: string): Array<{original: string, updated: string}> {
  const blocks: Array<{original: string, updated: string}> = [];
  const lines = content.split("\n");
  let i = 0;
  
  while (i < lines.length) {
    // Limpar linhas para comparação para lidar com possíveis espaços extras da IA
    const trimmedLine = lines[i].trim();
    
    if (trimmedLine === SEARCH_START) {
      let j = i + 1;
      let originalBlock = "";
      let updatedBlock = "";
      
      // Buscar o divisor
      while (j < lines.length && lines[j].trim() !== DIVIDER) {
        originalBlock += lines[j] + "\n";
        j++;
      }
      
      if (j < lines.length) j++; // Pular o divisor
      
      // Buscar o fim do bloco de substituição
      while (j < lines.length && lines[j].trim() !== REPLACE_END) {
        updatedBlock += lines[j] + "\n";
        j++;
      }
      
      // Remover últimas quebras de linha
      originalBlock = originalBlock.trimEnd();
      updatedBlock = updatedBlock.trimEnd();
      
      blocks.push({ original: originalBlock, updated: updatedBlock });
      
      // Atualizar o índice para continuar depois deste bloco
      i = j + 1;
    } else {
      i++;
    }
  }
  
  return blocks;
}

/**
 * Aplica blocos de diff a um conteúdo HTML.
 * @param {string} originalHtml - O conteúdo HTML original.
 * @param {string} diffContent - O conteúdo com as modificações no formato diff.
 * @returns {string} - O HTML com as modificações aplicadas.
 */
export function applyDiffs(originalHtml: string, diffContent: string): string {
  const blocks = parseDiffBlocks(diffContent);
  let modifiedHtml = originalHtml;
  
  // Se não houver blocos de diff no formato SEARCH/REPLACE, verificar se o diffContent é HTML completo
  if (blocks.length === 0) {
    // Verificar se o conteúdo parece ser HTML válido (começa com <!DOCTYPE ou <html)
    if (diffContent.trim().startsWith("<!DOCTYPE") || diffContent.trim().startsWith("<html")) {
      return diffContent; // Retornar o conteúdo como está, assumindo que é um HTML completo
    }
    
    // Caso contrário, tentar aplicar como diff tradicional
    return applyTraditionalDiff(originalHtml, diffContent);
  }
  
  // Aplicar cada bloco de substituição
  for (const block of blocks) {
    // Verificar se o bloco original existe no HTML
    if (modifiedHtml.includes(block.original)) {
      // Substituição direta
      modifiedHtml = modifiedHtml.replace(block.original, block.updated);
    } else {
      // Se não encontrar o bloco original exato, usar diff-match-patch para uma substituição mais flexível
      modifiedHtml = applyFuzzyDiff(modifiedHtml, block.original, block.updated);
    }
  }
  
  return modifiedHtml;
}

/**
 * Aplica diff tradicional usando diff-match-patch.
 * @param {string} originalText - O texto original.
 * @param {string} patchText - O texto com as modificações em formato de diff.
 * @returns {string} - O texto com as modificações aplicadas.
 */
function applyTraditionalDiff(originalText: string, patchText: string): string {
  try {
    const dmp = new diff_match_patch();
    const patches = dmp.patch_fromText(patchText);
    const [patchedText] = dmp.patch_apply(patches, originalText);
    return patchedText;
  } catch (error) {
    console.error("Erro ao aplicar diff tradicional:", error);
    return originalText; // Fallback para o texto original em caso de erro
  }
}

/**
 * Aplica substituição fuzzy usando diff-match-patch para lidar com diferenças pequenas.
 * @param {string} text - O texto original completo.
 * @param {string} search - O trecho a ser procurado.
 * @param {string} replace - O trecho de substituição.
 * @returns {string} - O texto com a substituição aplicada.
 */
function applyFuzzyDiff(text: string, search: string, replace: string): string {
  const dmp = new diff_match_patch();
  
  // Configurar o algoritmo para ser mais tolerante
  dmp.Match_Threshold = 0.7;
  dmp.Match_Distance = 1000;
  
  // Localizar a melhor correspondência para o texto de busca
  const match = dmp.match_main(text, search, 0);
  
  if (match !== -1) {
    // Substituir o trecho encontrado
    return text.substring(0, match) + replace + text.substring(match + search.length);
  }
  
  // Se não encontrar uma correspondência razoável, retornar o texto original
  return text;
}

/**
 * Verifica se um texto é HTML completo.
 * @param {string} text - O texto a verificar.
 * @returns {boolean} - Verdadeiro se o texto for HTML completo.
 */
export function isCompleteHtml(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith("<!DOCTYPE") || 
    trimmed.startsWith("<html") || 
    (trimmed.includes("<html") && trimmed.includes("</html>"))
  );
}

/**
 * Extrai as mudanças entre dois textos HTML em formato de blocos SEARCH/REPLACE.
 * @param {string} originalHtml - O HTML original.
 * @param {string} newHtml - O novo HTML.
 * @returns {string} - Texto com blocos de diff no formato SEARCH/REPLACE.
 */
export function extractDiffBlocks(originalHtml: string, newHtml: string): string {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(originalHtml, newHtml);
  dmp.diff_cleanupSemantic(diffs);
  
  let diffBlocks = "";
  let searchBlock = "";
  let replaceBlock = "";
  
  for (let i = 0; i < diffs.length; i++) {
    const [operation, text] = diffs[i];
    
    // Se houver texto substituído (removido e adicionado consecutivamente), criar um bloco de diff
    if (operation === -1 && i + 1 < diffs.length && diffs[i + 1][0] === 1) {
      searchBlock = text;
      replaceBlock = diffs[i + 1][1];
      
      diffBlocks += `${SEARCH_START}\n${searchBlock}\n${DIVIDER}\n${replaceBlock}\n${REPLACE_END}\n\n`;
      i++; // Pular o próximo diff (inserção) já processado
    }
  }
  
  return diffBlocks;
} 