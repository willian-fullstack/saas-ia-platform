"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthOptions } from "next-auth";

// Opções de autenticação para uso com NextAuth
export const authOptions: AuthOptions = {
  // Configurar provedores, callbacks, etc.
  // Esta é uma implementação mínima - ajuste conforme necessário
  providers: [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
        session.user.role = token.role || 'user';
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
  },
};

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
    if (status === "loading") return; // Ainda carregando, aguarde
    
    if (!session) {
      router.push("/login");
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
    if (status === "loading") return; // Ainda carregando, aguarde
    
    // Se o usuário estiver autenticado e estiver em uma página pública, redirecione
    if (session && (pathname === "/login" || pathname === "/")) {
      router.push("/dashboard");
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
    if (status === "loading") return; // Ainda carregando, aguarde
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [session, status, router, isAdmin]);
  
  return { 
    session: typedSession, 
    isAdmin, 
    isLoading: status === "loading" 
  };
} 