import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardParticles } from "@/components/dashboard/DashboardParticles";
import { GradientBackground } from "@/components/dashboard/GradientBackground";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAS IA Platform - Dashboard",
  description: "Plataforma All-in-One com IA para Criadores de Conteúdo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className={`min-h-screen flex flex-col ${montserrat.className}`}>
        {/* Efeitos de fundo */}
        <DashboardParticles />
        <GradientBackground />
        
        {/* Header do Dashboard */}
        <DashboardHeader />
        
        <div className="flex flex-1 relative z-10">
          {/* Sidebar */}
          <DashboardSidebar />
          
          {/* Conteúdo principal */}
          <main className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full">
            <div className="relative">
              {/* Decoração de fundo para o conteúdo principal */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
              
              {/* Conteúdo */}
              <div className="relative bg-background/60 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm p-6 min-h-[80vh]">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 