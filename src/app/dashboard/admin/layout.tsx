"use client";

import { useRequireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Users, Settings, ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useRequireAdmin();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">
            Verificando suas permissões de administrador.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const navItems = [
    {
      name: "Configurações de Créditos",
      path: "/dashboard/admin/credits",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      name: "Gerenciar Planos",
      path: "/dashboard/admin/plans",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      name: "Usuários",
      path: "/dashboard/admin/users",
      icon: <Users className="h-4 w-4 mr-2" />,
      disabled: true,
    },
  ];

  return (
    <div className="admin-layout max-w-7xl mx-auto px-4 py-6">
      <div className="admin-header bg-primary/10 py-4 px-6 mb-6 rounded-lg">
        <div className="flex items-center mb-2">
          <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
          <h1 className="text-2xl font-semibold">Painel de Administração</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações de sistema, planos e usuários
        </p>
      </div>
      
      <div className="admin-nav flex border-b mb-6 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.disabled ? "#" : item.path}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              pathname === item.path
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
              }
            }}
          >
            <span className="flex items-center">
              {item.icon}
              {item.name}
              {item.disabled && <span className="text-xs ml-2">(Em breve)</span>}
            </span>
          </Link>
        ))}
      </div>
      
      {children}
    </div>
  );
} 