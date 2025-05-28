import { diff_match_patch } from 'diff-match-patch';

/**
 * Utilitários para aplicar diferenças (diffs) em HTML
 * 
 * Este módulo fornece funções para aplicar diferenças em formato de texto
 * ao HTML de uma landing page, permitindo modificações incrementais.
 */

// Constantes para identificar partes do diff
const SEARCH_MARKER = '<<<<<<< SEARCH';
const SEPARATOR_MARKER = '=======';
const REPLACE_MARKER = '>>>>>>> REPLACE';

/**
 * Interface para um bloco de diferença
 */
interface DiffBlock {
  search: string;
  replace: string;
}

/**
 * Analisa uma string de diff e extrai os blocos de diferença
 * 
 * @param diffString - String contendo os blocos de diferença
 * @returns Array de blocos de diferença
 */
export function parseDiffBlocks(diffString: string): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  
  // Dividir a string em blocos
  const pattern = new RegExp(`${SEARCH_MARKER}([\\s\\S]*?)${SEPARATOR_MARKER}([\\s\\S]*?)${REPLACE_MARKER}`, 'g');
  let match;
  
  while ((match = pattern.exec(diffString)) !== null) {
    if (match.length === 3) {
      blocks.push({
        search: match[1].trim(),
        replace: match[2].trim()
      });
    }
  }
  
  return blocks;
}

/**
 * Aplica os blocos de diferença ao HTML
 * 
 * @param html - HTML original
 * @param blocks - Blocos de diferença a serem aplicados
 * @returns HTML modificado
 */
export function applyDiffBlocks(html: string, blocks: DiffBlock[]): string {
  let result = html;
  
  // Aplicar cada bloco de diferença
  for (const block of blocks) {
    // Escapar caracteres especiais em expressões regulares
    const searchRegex = block.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(searchRegex, 'g'), block.replace);
  }
  
  return result;
}

/**
 * Cria um bloco de diferença formatado
 * 
 * @param search - Texto a ser procurado
 * @param replace - Texto de substituição
 * @returns Bloco de diferença formatado
 */
export function createDiffBlock(search: string, replace: string): string {
  return `${SEARCH_MARKER}\n${search}\n${SEPARATOR_MARKER}\n${replace}\n${REPLACE_MARKER}`;
}

/**
 * Aplica uma string de diff ao HTML
 * 
 * @param html - HTML original
 * @param diffString - String contendo os blocos de diferença
 * @returns HTML modificado
 */
export function applyDiffs(html: string, diffString: string): string {
  const blocks = parseDiffBlocks(diffString);
  return applyDiffBlocks(html, blocks);
}

/**
 * Verifica se um diff é válido
 * 
 * @param diffString - String contendo os blocos de diferença
 * @returns true se o diff for válido, false caso contrário
 */
export function isValidDiff(diffString: string): boolean {
  try {
    const blocks = parseDiffBlocks(diffString);
    return blocks.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se o HTML é válido
 * 
 * @param html - HTML a ser verificado
 * @returns true se o HTML for válido, false caso contrário
 */
export function isValidHtml(html: string): boolean {
  // Verificação básica de tags
  const openTags = html.match(/<[^\/][^>]*>/g) || [];
  const closeTags = html.match(/<\/[^>]*>/g) || [];
  
  // Verificar se há um <!DOCTYPE html>
  const hasDoctype = html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>');
  
  // Verificar se há tags <html>, <head> e <body>
  const hasHtmlTag = html.includes('<html') && html.includes('</html>');
  const hasHeadTag = html.includes('<head') && html.includes('</head>');
  const hasBodyTag = html.includes('<body') && html.includes('</body>');
  
  // Verificar se o número de tags de abertura e fechamento é aproximadamente igual
  // (permitimos alguma diferença devido a tags que não precisam de fechamento)
  const tagDifference = Math.abs(openTags.length - closeTags.length);
  const isBalanced = tagDifference < 10; // Permitir até 10 tags de diferença
  
  return hasDoctype && hasHtmlTag && hasHeadTag && hasBodyTag && isBalanced;
}

/**
 * Cria uma string de diff a partir de múltiplos blocos
 * 
 * @param blocks - Array de blocos de diferença
 * @returns String formatada com todos os blocos de diferença
 */
export function createDiffString(blocks: DiffBlock[]): string {
  return blocks.map(block => createDiffBlock(block.search, block.replace)).join('\n\n');
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
      
      diffBlocks += `${SEARCH_MARKER}\n${searchBlock}\n${SEPARATOR_MARKER}\n${replaceBlock}\n${REPLACE_MARKER}\n\n`;
      i++; // Pular o próximo diff (inserção) já processado
    }
  }
  
  return diffBlocks;
} 