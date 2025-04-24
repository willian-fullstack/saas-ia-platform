"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User as UserIcon } from "lucide-react";
import { LogoutButton } from "./logout-button";
import Link from "next/link";

export function UserProfileButton() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        Carregando...
      </Button>
    );
  }
  
  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Entrar
        </Button>
      </Link>
    );
  }
  
  // Versão simplificada sem componentes Avatar e DropdownMenu
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm hidden md:block">
        Olá, <span className="font-semibold">{session.user?.name?.split(' ')[0]}</span>
      </div>
      
      <div className="flex gap-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <UserIcon className="mr-2 h-4 w-4" />
            Perfil
          </Button>
        </Link>
        
        <LogoutButton 
          variant="outline" 
          size="sm"
        />
      </div>
    </div>
  );
} 