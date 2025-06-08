import Link from "next/link";
import Image from "next/image";
import { Edit, ImageIcon, Video, Layout, Gift, MessageSquare, CreditCard, Sparkles } from "lucide-react";
import { PricingSection } from "@/components/home/PricingSection";
import { NeuralBackground } from "@/components/home/NeuralBackground";
import { ParticlesBackground } from "@/components/home/ParticlesBackground";
import { GradientEffects } from "@/components/home/GradientEffects";
import { InteractiveCard } from "@/components/home/InteractiveCard";
import { AnimatedTitle } from "@/components/home/AnimatedTitle";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      {/* Efeitos de fundo */}
      <GradientEffects />
      <ParticlesBackground />
      <NeuralBackground />
      
      {/* Header */}
      <header className="relative z-10 w-full py-4 px-6 flex items-center justify-between backdrop-blur-sm bg-background/30">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="relative md:hidden">
              <Image 
                src="/logo.svg" 
                alt="ExecutaAi Logo Icon" 
                width={36} 
                height={36} 
                className="group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <div className="relative">
              <Image 
                src="/img/logo_claro.png" 
                alt="ExecutaAi" 
                width={220}
                height={60}
                className="block dark:hidden" 
                priority
              />
              <Image 
                src="/img/logo_escuro.png" 
                alt="ExecutaAi" 
                width={220}
                height={60}
                className="hidden dark:block" 
                priority
              />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex space-x-2">
          <Link 
            href="/login" 
            className="px-4 py-2 rounded-md border border-input bg-background/80 backdrop-blur-sm shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-md bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary/80 transition-colors"
          >
            Acessar Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <AnimatedTitle as="h1" className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                ExecutaAi
            </AnimatedTitle>
            <p className="text-xl text-muted-foreground max-w-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Plataforma All-in-One para Criadores de Conteúdo, Afiliados, Dropshippers e Closers
              com soluções de IA para copywriting, criação de imagens, vídeos e muito mais.
            </p>
            <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Link 
                href="/dashboard" 
                className="group relative px-6 py-3 rounded-md bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg hover:bg-primary/80 transition-all overflow-hidden"
              >
                <span className="absolute inset-0 w-0 bg-white/10 transition-all duration-500 ease-out group-hover:w-full"></span>
                <span className="relative">Acessar Dashboard</span>
              </Link>
              <Link 
                href="/login" 
                className="group relative px-6 py-3 rounded-md border border-input bg-background/80 backdrop-blur-sm font-medium shadow-md hover:shadow-lg hover:bg-accent hover:text-accent-foreground transition-all overflow-hidden"
              >
                <span className="absolute inset-0 w-0 bg-primary/10 transition-all duration-500 ease-out group-hover:w-full"></span>
                <span className="relative">Login / Cadastro</span>
              </Link>
            </div>
            <div className="flex items-center pt-2 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="flex -space-x-2 mr-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{i}</span>
                  </div>
                ))}
              </div>
              <span>+500 criadores de conteúdo já utilizam</span>
            </div>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <InteractiveCard className="bg-card/80 backdrop-blur-sm border rounded-3xl p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mt-6 -mr-6 blur-xl"></div>
              <h2 className="text-xl font-semibold mb-4">Experimente agora</h2>
              <div className="space-y-4">
                <div className="bg-background/60 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors hover:bg-background/80 group">
                  <h3 className="font-medium flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                    IA de Copywriting
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gere textos persuasivos para anúncios, landing pages, scripts e e-mails.
                  </p>
                </div>
                <div className="bg-background/60 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors hover:bg-background/80 group">
                  <h3 className="font-medium flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                    Criativos Visuais
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie imagens impactantes com ganchos visuais otimizados para conversão.
                  </p>
                </div>
                <div className="bg-background/60 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors hover:bg-background/80 group">
                  <h3 className="font-medium flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                    Consultor IA 24h
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat em tempo real com IA especializada em marketing e vendas.
                  </p>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <AnimatedTitle as="h2" className="text-3xl font-bold mb-4">
            Solução completa para criadores digitais
          </AnimatedTitle>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Nossa plataforma oferece todas as ferramentas que você precisa para criar conteúdo de alta conversão e escalar seus resultados.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "IA de Copywriting",
              description: "Gere textos persuasivos para anúncios, landing pages, scripts e e-mails com nossa IA especializada.",
              icon: <Edit className="h-6 w-6 text-primary" />,
              delay: 0.1
            },
            {
              title: "Criativos Visuais",
              description: "Crie imagens impactantes com ganchos visuais e elementos otimizados para conversão.",
              icon: <ImageIcon className="h-6 w-6 text-primary" />,
              delay: 0.2
            },
            {
              title: "Vídeos Curtos",
              description: "Roteiros para Shorts/Reels com formato CapCut e geração de scripts para vídeos curtos.",
              icon: <Video className="h-6 w-6 text-primary" />,
              delay: 0.3
            },
            {
              title: "Landing Pages",
              description: "Criação automática de páginas de vendas otimizadas para conversão com templates profissionais.",
              icon: <Layout className="h-6 w-6 text-primary" />,
              delay: 0.4
            },
            {
              title: "IA de Ofertas",
              description: "Geração de ofertas persuasivas completas com configurações personalizáveis para seu produto e público.",
              icon: <Gift className="h-6 w-6 text-primary" />,
              delay: 0.5
            },
            {
              title: "Consultor IA 24h",
              description: "Chat em tempo real com IA especializada em marketing, tráfego, vendas e criação de conteúdo.",
              icon: <MessageSquare className="h-6 w-6 text-primary" />,
              delay: 0.6
            }
          ].map((feature, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${feature.delay}s` }}>
              <InteractiveCard 
                className="bg-card/50 backdrop-blur-sm border rounded-xl p-6"
                intensity={10}
              >
              <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              </InteractiveCard>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section - Carrega planos reais dinamicamente */}
      <PricingSection />

      {/* Call-to-Action */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <InteractiveCard className="max-w-4xl mx-auto bg-primary/5 backdrop-blur-sm border border-primary/20 rounded-3xl p-8 md:p-12" intensity={5}>
            <div className="text-center">
              <AnimatedTitle as="h2" className="text-3xl font-bold mb-4">
                Pronto para revolucionar sua produção de conteúdo?
              </AnimatedTitle>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Junte-se a centenas de criadores que já estão economizando tempo e maximizando seus resultados com a ExecutaAi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard" 
                  className="group relative px-6 py-3 rounded-md bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg hover:bg-primary/80 transition-all overflow-hidden"
              >
                  <span className="absolute inset-0 w-0 bg-white/10 transition-all duration-500 ease-out group-hover:w-full"></span>
                  <span className="relative">Acessar Dashboard</span>
              </Link>
              <Link 
                href="/login" 
                  className="group relative px-6 py-3 rounded-md border border-input bg-background/80 backdrop-blur-sm font-medium shadow-md hover:shadow-lg hover:bg-accent hover:text-accent-foreground transition-all overflow-hidden"
              >
                  <span className="absolute inset-0 w-0 bg-primary/10 transition-all duration-500 ease-out group-hover:w-full"></span>
                  <span className="relative">Login / Cadastro</span>
              </Link>
            </div>
          </div>
          </InteractiveCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto py-8 px-4 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              alt="ExecutaAi Logo" 
              width={24} 
              height={24} 
              className="dark:invert"
            />
            <span className="text-sm text-muted-foreground">
              © 2024 ExecutaAi - Todos os direitos reservados
            </span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Suporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
