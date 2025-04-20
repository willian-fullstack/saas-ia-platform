import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-5xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            SAS IA Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma All-in-One para Criadores de Conteúdo, Afiliados, Dropshippers e Closers
            com soluções de IA para copywriting, criação de imagens, vídeos e muito mais.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">IA de Copywriting</h2>
            <p className="text-muted-foreground mb-4">
              Gere textos persuasivos para anúncios, landing pages, scripts e e-mails com nossa IA especializada.
            </p>
            <div className="flex justify-center">
              <Image 
                src="/copywriting-icon.svg" 
                alt="Copywriting Icon" 
                width={60} 
                height={60}
                className="opacity-80"
              />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Criativos Visuais</h2>
            <p className="text-muted-foreground mb-4">
              Crie imagens impactantes com ganchos visuais e elementos otimizados para conversão.
            </p>
            <div className="flex justify-center">
        <Image
                src="/creative-icon.svg" 
                alt="Creative Icon" 
                width={60} 
                height={60}
                className="opacity-80"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1"
          >
            Acessar Dashboard
          </Link>
          <Link 
            href="/login" 
            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1"
          >
            Login / Cadastro
          </Link>
        </div>

        <div className="pt-8 border-t text-sm text-muted-foreground">
          <p>© 2024 SAS IA Platform - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}
