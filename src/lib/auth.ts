"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Função auxiliar para log
function logAuthHook(hook: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH-HOOK ${timestamp}] [${hook}] ${message}`);
  if (data) {
    console.log(`[AUTH-HOOK ${timestamp}] [${hook}] Data:`, data);
  }
}

// Definição de tipo estendida para incluir a propriedade role no usuário
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'user' | 'admin';
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

/**
 * Hook para proteger páginas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    logAuthHook('useRequireAuth', `Status: ${status}`, { 
      hasSession: !!session, 
      user: session?.user?.email
    });
    
    if (status === "loading") return; // Ainda carregando, aguarde
    
    if (!session) {
      logAuthHook('useRequireAuth', 'Usuário não autenticado, redirecionando para login');
      router.push("/login");
    } else {
      logAuthHook('useRequireAuth', 'Usuário autenticado', { 
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      });
    }
  }, [session, status, router]);
  
  return { session, isLoading: status === "loading" };
}

/**
 * Hook para redirecionar usuários autenticados para o dashboard
 * Útil em páginas de login ou cadastro
 */
export function useRedirectIfAuthenticated() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    logAuthHook('useRedirectIfAuthenticated', `Status: ${status}, Pathname: ${pathname}`, { 
      hasSession: !!session, 
      user: session?.user?.email
    });
    
    if (status === "loading") return; // Ainda carregando, aguarde
    
    // Se o usuário estiver autenticado e estiver em uma página pública, redirecione
    if (session && (pathname === "/login" || pathname === "/")) {
      logAuthHook('useRedirectIfAuthenticated', 'Usuário já autenticado, redirecionando para dashboard');
      router.push("/dashboard");
    } else if (session) {
      logAuthHook('useRedirectIfAuthenticated', 'Usuário autenticado, mas não em página pública');
    } else {
      logAuthHook('useRedirectIfAuthenticated', 'Usuário não autenticado, permanecendo na página');
    }
  }, [session, status, router, pathname]);
  
  return { session, isLoading: status === "loading" };
}

/**
 * Hook para verificar se o usuário atual é um administrador
 * Retorna um objeto com isAdmin e isLoading
 */
export function useIsAdmin() {
  const { data: session, status } = useSession();
  const typedSession = session as ExtendedSession | null;
  const isAdmin = typedSession?.user?.role === "admin";
  
  useEffect(() => {
    logAuthHook('useIsAdmin', `Status: ${status}`, { 
      hasSession: !!session, 
      user: session?.user?.email,
      isAdmin
    });
  }, [session, status, isAdmin]);
  
  return { 
    isAdmin, 
    isLoading: status === "loading" 
  };
}

/**
 * Hook para proteger páginas que requerem acesso de administrador
 * Redireciona para o dashboard se o usuário não for admin
 */
export function useRequireAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const typedSession = session as ExtendedSession | null;
  const isAdmin = typedSession?.user?.role === "admin";
  
  useEffect(() => {
    logAuthHook('useRequireAdmin', `Status: ${status}`, { 
      hasSession: !!session, 
      user: session?.user?.email,
      isAdmin
    });
    
    if (status === "loading") return; // Ainda carregando, aguarde
    
    if (!session) {
      logAuthHook('useRequireAdmin', 'Usuário não autenticado, redirecionando para login');
      router.push("/login");
      return;
    }
    
    if (!isAdmin) {
      logAuthHook('useRequireAdmin', 'Usuário não é admin, redirecionando para dashboard');
      router.push("/dashboard");
    } else {
      logAuthHook('useRequireAdmin', 'Usuário é admin, permitindo acesso');
    }
  }, [session, status, router, isAdmin]);
  
  return { 
    session: typedSession, 
    isAdmin, 
    isLoading: status === "loading" 
  };
} 