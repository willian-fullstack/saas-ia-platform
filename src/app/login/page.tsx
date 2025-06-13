"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRedirectIfAuthenticated } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useRedirectIfAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form states
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("[LOGIN] Iniciando processo de login para:", loginEmail);
    
    try {
      console.log("[LOGIN] Chamando signIn...");
      const result = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });
      
      console.log("[LOGIN] Resultado do signIn:", result);
      
      if (result?.error) {
        console.error("[LOGIN] Erro retornado pelo signIn:", result.error);
        toast.error("Falha no login. Verifique suas credenciais.");
        return;
      }
      
      console.log("[LOGIN] Login bem-sucedido, redirecionando para dashboard");
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } catch (error) {
      console.error("[LOGIN] Erro durante o processo de login:", error);
      toast.error("Ocorreu um erro ao realizar o login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fazer uma chamada para a API de registro
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao registrar");
      }
      
      toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
      
      // Limpar o formulário
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no cadastro. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se estiver carregando a autenticação, mostra um estado de carregamento
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <div className="flex-1 flex flex-col justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-6">
            <Image
              src="/img/favicon.png"
              alt="ExecutaAi Logo"
              width={60}
              height={60}
              className="dark:invert"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-8">
            ExecutaAi
          </h1>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="bg-card border rounded-lg p-6 shadow-md">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Senha</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="bg-card border rounded-lg p-6 shadow-md">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="text-center mt-8">
            <Link href="/" className="text-sm text-primary flex items-center justify-center hover:underline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>© 2024 ExecutaAi - Todos os direitos reservados</p>
      </footer>
    </div>
  );
} 