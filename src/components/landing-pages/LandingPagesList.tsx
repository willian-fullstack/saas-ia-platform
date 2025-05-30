import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Pencil, 
  Eye, 
  Trash2,
  Code,
  Clock,
  Tag,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

// Interfaces
interface LandingPage {
  _id: string;
  title: string;
  description: string;
  html: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DeepSiteSession {
  sessionId: string;
  name: string;
  createdAt: string;
  lastActivity: string;
}

interface LandingPagesListProps {
  landingPages: LandingPage[];
  sessions: DeepSiteSession[];
  onView: (landingPage: LandingPage) => void;
  onEdit: (landingPage: LandingPage) => void;
  onDelete: (landingPage: LandingPage) => void;
  onContinueSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export default function LandingPagesList({
  landingPages,
  sessions,
  onView,
  onEdit,
  onDelete,
  onContinueSession,
  onDeleteSession,
  isLoading = false
}: LandingPagesListProps) {
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Renderizar indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Listar landing pages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Minhas Landing Pages</h2>
        
        {landingPages.length === 0 ? (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-muted-foreground">
                Você ainda não tem landing pages. Crie uma nova usando a aba "Gerar Nova".
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {landingPages.map((landingPage) => (
              <Card key={landingPage._id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate" title={landingPage.title}>
                    {landingPage.title}
                  </CardTitle>
                  <CardDescription>
                    {landingPage.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {landingPage.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {landingPage.tags.length === 0 && (
                      <span className="text-xs text-muted-foreground">Sem tags</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3" />
                    <span>Atualizada em {formatDate(landingPage.updatedAt)}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onView(landingPage)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(landingPage)}
                      title="Editar com DeepSite"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDelete(landingPage)}
                      className="text-destructive hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Listar sessões de edição DeepSite */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sessões de Edição DeepSite</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.sessionId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{session.name}</CardTitle>
                  <CardDescription>
                    Última atividade: {formatDate(session.lastActivity)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Criada em {formatDate(session.createdAt)}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onContinueSession(session.sessionId)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Continuar Edição
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteSession(session.sessionId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 