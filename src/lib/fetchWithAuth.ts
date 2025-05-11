/**
 * Utilitário para fazer requisições HTTP com autenticação
 * Garante que os cookies de autenticação sejam incluídos em todas as requisições
 */

export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Obter os headers existentes
  const existingHeaders = options.headers || {};
  
  // Criar um novo objeto de headers
  const headers = new Headers();
  
  // Adicionar o Content-Type padrão se não existir
  headers.append('Content-Type', 'application/json');
  
  // Adicionar headers existentes
  if (existingHeaders instanceof Headers) {
    // Se for uma instância de Headers, iterar sobre ela
    existingHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  } else if (typeof existingHeaders === 'object') {
    // Se for um objeto simples
    Object.entries(existingHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });
  }

  // Garantir que as credenciais serão incluídas (cookies de sessão)
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include', // Isso é essencial para enviar cookies de autenticação
    headers,
  };

  // Fazer a requisição com as opções configuradas
  const response = await fetch(url, fetchOptions);
  
  // Se receber 401 (não autorizado), pode indicar que a sessão expirou
  if (response.status === 401) {
    console.error('Erro de autenticação - Sessão pode ter expirado');
    // Se necessário, você pode redirecionar para a página de login aqui
    // window.location.href = '/login';
  }
  
  return response;
} 