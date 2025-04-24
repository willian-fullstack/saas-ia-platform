"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

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