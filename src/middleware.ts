import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/api/auth'];

// Rotas de API que devem ser públicas
const publicApiRoutes = [
  '/api/auth', 
  '/api/webhooks', 
  '/api/landing-pages/deepsite/ask-ai',
  '/api/landing-pages/deepsite/session',
  '/api/landing-pages/deepsite/apply-diffs'
];

// Middleware de autenticação
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log para diagnóstico
  console.log('Middleware executando para caminho:', pathname);
  
  // Verificar se a rota é pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    console.log('Rota pública, permitindo acesso:', pathname);
    return NextResponse.next();
  }
  
  // Para rotas de API, verificar o token JWT, exceto para as rotas públicas da API
  if (pathname.startsWith('/api/') && !isPublicApiRoute) {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production"
      });
      
      if (!token) {
        console.log('Token JWT não encontrado para rota de API:', pathname);
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Não autorizado' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      
      console.log('Token JWT válido para rota de API:', pathname);
      return NextResponse.next();
    } catch (error) {
      console.error('Erro ao verificar token JWT:', error);
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Erro de autenticação' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
  // Para rotas de páginas (não-API), deixar o client-side se encarregar
  return NextResponse.next();
}

// Configuração de matching para o middleware
export const config = {
  // Aplicar apenas em rotas específicas para evitar interferência com o NextAuth
  matcher: [
    /*
     * Excluir rotas específicas para evitar conflitos:
     * - Todas as rotas que não comecem com: api/auth, _next, public, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 