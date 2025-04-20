"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Globe, PaintBucket, Shield, Moon, Sun, Laptop, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("system");
  
  const handleThemeChange = (value: string) => {
    setTheme(value);
    // Aqui seria implementada a lógica real de mudança de tema
    toast.success(`Tema alterado para ${value}`);
  };
  
  const handleApiKeyGeneration = async () => {
    setIsLoading(true);
    
    try {
      // Simulando delay para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const apiKey = `sk_sas_${Math.random().toString(36).substring(2, 15)}`;
      
      // Aqui seria a lógica real para salvar a nova API key
      toast.success("Nova API key gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar nova API key.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulando delay para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua conta e da plataforma.
          </p>
        </div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="border-b">
          <TabsList className="w-full justify-start rounded-none px-0 bg-transparent border-b-0">
            <TabsTrigger 
              value="general" 
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
            >
              Aparência
            </TabsTrigger>
            <TabsTrigger 
              value="api" 
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
            >
              API
            </TabsTrigger>
            <TabsTrigger 
              value="language" 
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4"
            >
              Idioma
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="pt-6">
          <TabsContent value="general" className="space-y-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Configurações Gerais</h2>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    defaultValue="60"
                    min="15"
                    max="240"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tempo em minutos até que a sessão expire por inatividade.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Notificações no Navegador</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="browser-notifications"
                      defaultChecked
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <Label htmlFor="browser-notifications" className="text-sm font-normal">
                      Ativar notificações no navegador
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações no navegador quando tarefas importantes forem concluídas.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Navegação</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirm-navigation"
                      defaultChecked
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <Label htmlFor="confirm-navigation" className="text-sm font-normal">
                      Confirmar antes de sair de páginas com formulários não salvos
                    </Label>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <div className="flex items-center gap-2">
              <PaintBucket className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Aparência</h2>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex flex-wrap gap-4">
                    <div 
                      className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg border ${theme === 'light' ? 'border-primary bg-accent' : 'border-input hover:border-muted-foreground'}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="h-20 w-24 rounded-md bg-[#FFFFFF] border flex items-center justify-center">
                        <Sun className="h-10 w-10 text-yellow-500" />
                      </div>
                      <span className="text-sm font-medium">Claro</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg border ${theme === 'dark' ? 'border-primary bg-accent' : 'border-input hover:border-muted-foreground'}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="h-20 w-24 rounded-md bg-[#1F2937] border flex items-center justify-center">
                        <Moon className="h-10 w-10 text-blue-300" />
                      </div>
                      <span className="text-sm font-medium">Escuro</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg border ${theme === 'system' ? 'border-primary bg-accent' : 'border-input hover:border-muted-foreground'}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      <div className="h-20 w-24 rounded-md border bg-gradient-to-r from-[#FFFFFF] to-[#1F2937] flex items-center justify-center">
                        <Laptop className="h-10 w-10 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Sistema</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">
                    Escolha um tema para a interface da plataforma.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Densidade de Interface</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="density-comfortable"
                        name="density"
                        defaultChecked
                        className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
                      />
                      <Label htmlFor="density-comfortable" className="text-sm font-normal">
                        Confortável
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="density-compact"
                        name="density"
                        className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
                      />
                      <Label htmlFor="density-compact" className="text-sm font-normal">
                        Compacto
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o espaçamento entre os elementos da interface.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Chaves de API</h2>
            </div>
            
            <div className="border rounded-lg p-6 bg-card space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">Sua chave de API</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="api-key"
                    type="password"
                    value="sk_sas_7f9a8b7c6d5e4f3g2h1i"
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText("sk_sas_7f9a8b7c6d5e4f3g2h1i");
                      toast.success("Chave de API copiada para a área de transferência");
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta é sua chave de API secreta. Não compartilhe com ninguém.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleApiKeyGeneration}
                  disabled={isLoading}
                >
                  {isLoading ? "Gerando..." : "Gerar nova chave de API"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Atenção: Gerar uma nova chave invalidará todas as chaves anteriores.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="language" className="space-y-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Idioma e Regionalização</h2>
            </div>
            
            <div className="border rounded-lg p-6 bg-card space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma da Interface</Label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Escolha o idioma em que a plataforma será exibida.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-format">Formato de Data</Label>
                <select
                  id="date-format"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                  <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                  <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Escolha como as datas devem ser exibidas na plataforma.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time-format">Formato de Hora</Label>
                <select
                  id="time-format"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="HH:mm">24 horas (14:30)</option>
                  <option value="hh:mm a">12 horas (02:30 PM)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Escolha como os horários devem ser exibidos na plataforma.
                </p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button>Salvar preferências</Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 