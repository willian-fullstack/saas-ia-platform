"use client";

import { signOut } from "next-auth/react";
import { Button, ButtonProps } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

interface LogoutButtonProps extends ButtonProps {
  showText?: boolean;
}

export function LogoutButton({ 
  showText = true, 
  className, 
  variant = "ghost", 
  size = "default", 
  ...props 
}: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logout realizado com sucesso");
      // Redirecionar para a página inicial após 1 segundo
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      toast.error("Erro ao realizar logout");
      console.error("Erro de logout:", error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      {...props}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {showText && "Sair"}
    </Button>
  );
} 