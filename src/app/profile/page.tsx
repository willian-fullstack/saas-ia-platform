"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, CreditCard, Bell, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth";

export default function Profile() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    bio: "",
    company: "",
    phone: "",
    notifications: {
      email: true,
      marketing: false,
      updates: true
    }
  });

  // Carregar dados do usuário da API
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) return;
      
      try {
        setIsProfileLoading(true);
        const response = await fetch('/api/user/profile');
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.user.name || "",
            email: data.user.email || "",
            bio: data.user.bio || "",
            company: data.user.company || "",
            phone: data.user.phone || "",
            notifications: data.user.notifications || {
              email: true,
              marketing: false,
              updates: true
            }
          });
        } else {
          // Fallback para dados da sessão
          setUserData(prevData => ({
            ...prevData,
            name: session.user?.name || "",
            email: session.user?.email || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        // Fallback para dados da sessão
        setUserData(prevData => ({
          ...prevData,
          name: session.user?.name || "",
          email: session.user?.email || "",
        }));
      } finally {
        setIsProfileLoading(false);
      }
    };
    
    if (session?.user && !authLoading) {
      fetchUserProfile();
    }
  }, [session, authLoading]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          bio: userData.bio,
          company: userData.company,
          phone: userData.phone
        })
      });
      
      if (response.ok) {
      toast.success("Perfil atualizado com sucesso!");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNotificationsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name, // Nome é obrigatório na API
          notifications: userData.notifications
        })
      });
      
      if (response.ok) {
      toast.success("Configurações de notificações atualizadas!");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar notificações");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar notificações");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulando delay para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Senha alterada com sucesso!");
      
      // Limpar os campos de senha após alteração
      const form = e.target as HTMLFormElement;
      form.reset();
    } catch (error) {
      toast.error("Erro ao alterar senha. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <div className="w-20"></div> {/* Para centralizar o título */}
        </div>
      </header>
      
      <main className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar/Tabs */}
          <div className="w-full md:w-64 space-y-8">
            <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-medium text-lg">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
            
            <Tabs defaultValue="profile" className="w-full md:hidden">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
                <TabsTrigger value="notifications">Notificações</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="hidden md:flex md:flex-col space-y-1">
              <Link 
                href="#profile" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground bg-accent transition-all hover:text-foreground hover:bg-accent"
              >
                <User className="h-5 w-5" />
                <span>Perfil</span>
              </Link>
              
              <Link 
                href="#security" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
              >
                <Shield className="h-5 w-5" />
                <span>Segurança</span>
              </Link>
              
              <Link 
                href="#notifications" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </Link>
              
              <Link 
                href="#billing" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
              >
                <CreditCard className="h-5 w-5" />
                <span>Assinatura</span>
              </Link>
              
              <Link 
                href="/profile/my-creations" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
              >
                <Edit className="h-5 w-5" />
                <span>Minhas Criações</span>
              </Link>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <Tabs defaultValue="profile" className="md:hidden">
              <TabsContent value="profile">
                <ProfileTab 
                  userData={userData} 
                  setUserData={setUserData} 
                  isLoading={isLoading} 
                  onSubmit={handleProfileUpdate} 
                />
              </TabsContent>
              
              <TabsContent value="security">
                <SecurityTab 
                  isLoading={isLoading} 
                  onSubmit={handlePasswordChange} 
                />
              </TabsContent>
              
              <TabsContent value="notifications">
                <NotificationsTab 
                  userData={userData} 
                  setUserData={setUserData} 
                  isLoading={isLoading} 
                  onSubmit={handleNotificationsUpdate} 
                />
              </TabsContent>
            </Tabs>
            
            <div className="hidden md:block space-y-8">
              <section id="profile">
                <ProfileTab 
                  userData={userData} 
                  setUserData={setUserData} 
                  isLoading={isLoading} 
                  onSubmit={handleProfileUpdate} 
                />
              </section>
              
              <section id="security">
                <SecurityTab 
                  isLoading={isLoading} 
                  onSubmit={handlePasswordChange} 
                />
              </section>
              
              <section id="notifications">
                <NotificationsTab 
                  userData={userData} 
                  setUserData={setUserData} 
                  isLoading={isLoading} 
                  onSubmit={handleNotificationsUpdate} 
                />
              </section>
              
              <section id="billing" className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Assinatura</h2>
                </div>
                
                <div className="border rounded-lg p-6 bg-card space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Plano Atual</span>
                      <span className="text-primary font-medium">Pro</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Acesso a todos os recursos da plataforma com limitações de uso.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Detalhes do Plano</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Próxima cobrança</p>
                        <p>15/05/2024</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor mensal</p>
                        <p>R$ 97,00</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Método de pagamento</p>
                        <p>Cartão de crédito •••• 4242</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="text-green-500">Ativo</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                      <Button variant="outline">Atualizar forma de pagamento</Button>
                      <Button variant="outline" className="text-destructive hover:text-destructive">
                        Cancelar assinatura
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ProfileTabProps {
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function ProfileTab({ userData, setUserData, isLoading, onSubmit }: ProfileTabProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Informações do Perfil</h2>
      </div>
      
      <div className="border rounded-lg p-6 bg-card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                value={userData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Empresa/Organização</Label>
              <Input
                id="company"
                name="company"
                value={userData.company}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={userData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={userData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SecurityTabProps {
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function SecurityTab({ isLoading, onSubmit }: SecurityTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Segurança</h2>
      </div>
      
      <div className="border rounded-lg p-6 bg-card">
        <form onSubmit={onSubmit} className="space-y-4">
          <h3 className="text-lg font-medium">Alterar Senha</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface NotificationsTabProps {
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function NotificationsTab({ userData, setUserData, isLoading, onSubmit }: NotificationsTabProps) {
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Notificações</h2>
      </div>
      
      <div className="border rounded-lg p-6 bg-card">
        <form onSubmit={onSubmit} className="space-y-6">
          <h3 className="text-lg font-medium">Preferências de Email</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="email-notifications"
                  name="email"
                  type="checkbox"
                  checked={userData.notifications.email}
                  onChange={handleNotificationChange}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="email-notifications">Alertas e notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receba emails sobre suas atividades e resultados na plataforma.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="marketing-notifications"
                  name="marketing"
                  type="checkbox"
                  checked={userData.notifications.marketing}
                  onChange={handleNotificationChange}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="marketing-notifications">Emails de marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Receba informações sobre novos recursos, promoções e eventos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="updates-notifications"
                  name="updates"
                  type="checkbox"
                  checked={userData.notifications.updates}
                  onChange={handleNotificationChange}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="updates-notifications">Atualizações da plataforma</Label>
                <p className="text-sm text-muted-foreground">
                  Receba informações sobre atualizações, melhorias e novidades na plataforma.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar preferências"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 