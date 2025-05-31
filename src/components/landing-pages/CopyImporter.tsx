import React, { useState, useRef, useEffect } from 'react';
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { 
  Loader2,
  Image as ImageIcon,
  X,
  FileText,
  Upload
} from "lucide-react";
import { toast } from "sonner";

interface CopyImporterProps {
  onSuccess: (landingPageId: string) => void;
}

export default function CopyImporter({ onSuccess }: CopyImporterProps) {
  // Estados do formulário
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  
  const [copyText, setCopyText] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("minimalista");
  
  // Estado para imagens
  const [images, setImages] = useState<{
    id?: string;
    file?: File;
    preview: string;
    url?: string;
    uploading?: boolean;
    error?: string;
  }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para imagens existentes
  const [userImages, setUserImages] = useState<{
    id: string;
    url: string;
    filename: string;
    originalname: string;
  }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Carregar imagens do usuário
  useEffect(() => {
    fetchUserImages();
  }, []);
  
  // Animação de pontos de carregamento
  useEffect(() => {
    if (loading) {
      const messages = [
        "Analisando o texto...",
        "Identificando elementos-chave...",
        "Estruturando o conteúdo...",
        "Criando elementos visuais...",
        "Otimizando para conversão...",
        "Aplicando design responsivo...",
        "Finalizando a landing page..."
      ];
      
      let currentMessageIndex = 0;
      const messageInterval = setInterval(() => {
        if (currentMessageIndex < messages.length) {
          setLoadingMessage(messages[currentMessageIndex]);
          currentMessageIndex++;
        }
      }, 3000);
      
      // Animação de pontos
      const dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 500);
      
      return () => {
        clearInterval(messageInterval);
        clearInterval(dotsInterval);
      };
    }
  }, [loading]);
  
  // Limpar as URLs das imagens ao desmontar o componente
  useEffect(() => {
    return () => {
      // Revogar as URLs de objeto criadas para as previews
      images.forEach(img => {
        if (img.preview && !img.url) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);
  
  // Buscar imagens do usuário
  const fetchUserImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch('/api/images/list');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar imagens');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setUserImages(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar imagens do usuário:', error);
    } finally {
      setLoadingImages(false);
    }
  };
  
  // Upload de uma imagem
  const uploadImage = async (file: File): Promise<{ id: string, url: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          id: data.data.id,
          url: data.data.url
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };
  
  // Upload de imagens
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: typeof images = [];
      
      Array.from(e.target.files).forEach(file => {
        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
          toast.error(`O arquivo ${file.name} não é uma imagem válida`);
          return;
        }
        
        // Limitar o tamanho a 5MB
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`A imagem ${file.name} excede 5MB`);
          return;
        }
        
        // Criar URL de preview
        const preview = URL.createObjectURL(file);
        newImages.push({ 
          file, 
          preview,
          uploading: true 
        });
      });
      
      // Adicionar novas imagens (limitando a 5 no total)
      if (images.length + newImages.length > 5) {
        toast.error("Limite de 5 imagens excedido");
        // Adicionar apenas até o limite
        newImages.slice(0, 5 - images.length).forEach(img => {
          setImages(prev => [...prev, img]);
        });
      } else {
        setImages(prev => [...prev, ...newImages]);
      }
      
      // Fazer upload das novas imagens
      const updatedImages = [...images, ...newImages];
      
      // Upload de cada imagem em paralelo
      const uploadPromises = newImages.map(async (img, index) => {
        const realIndex = images.length + index;
        
        if (!img.file) return;
        
        try {
          const result = await uploadImage(img.file);
          
          if (result) {
            // Atualizar o estado com o resultado do upload
            setImages(current => 
              current.map((item, i) => 
                i === realIndex ? { 
                  ...item, 
                  id: result.id,
                  url: result.url,
                  uploading: false 
                } : item
              )
            );
          } else {
            throw new Error('Falha no upload da imagem');
          }
        } catch (error) {
          console.error(`Erro ao fazer upload da imagem ${realIndex}:`, error);
          
          // Atualizar estado com erro
          setImages(current => 
            current.map((item, i) => 
              i === realIndex ? { 
                ...item, 
                uploading: false,
                error: 'Erro no upload'
              } : item
            )
          );
          
          toast.error(`Erro ao fazer upload da imagem ${img.file.name}`);
        }
      });
      
      // Aguardar todos os uploads
      await Promise.allSettled(uploadPromises);
    }
    
    // Limpar o input file
    if (e.target.value) {
      e.target.value = '';
    }
  };
  
  // Selecionar imagem existente
  const selectExistingImage = (image: typeof userImages[0]) => {
    if (images.length >= 5) {
      toast.error("Limite de 5 imagens excedido");
      return;
    }
    
    // Adicionar imagem existente
    setImages(prev => [...prev, {
      id: image.id,
      url: image.url,
      preview: image.url
    }]);
  };
  
  // Remover uma imagem 
  const removeImage = (index: number) => {
    const img = images[index];
    
    // Revogar a URL do objeto para liberar memória se for preview local
    if (img.preview && !img.url) {
      URL.revokeObjectURL(img.preview);
    }
    
    // Remover a imagem do array
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Abrir o seletor de arquivo
  const triggerFileInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!copyText || !title) {
      toast.error("Preencha os campos obrigatórios: Título e Texto da Copy");
      return;
    }
    
    // Verificar se há uploads pendentes
    const pendingUploads = images.some(img => img.uploading);
    if (pendingUploads) {
      toast.error("Aguarde o upload de todas as imagens antes de prosseguir");
      return;
    }
    
    // Verificar se há erros de upload
    const failedUploads = images.some(img => img.error);
    if (failedUploads) {
      toast.error("Remova as imagens com erro antes de prosseguir");
      return;
    }
    
    setLoading(true);
    setLoadingMessage("Iniciando criação da landing page...");
    
    try {
      // Obter URLs das imagens
      const imageUrls = images.map(img => img.url || '').filter(url => url);
      
      setLoadingMessage("Enviando dados para IA...");

      // Fazer a requisição para a API de importação de copy
      const response = await fetch('/api/landing-pages/import-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          copyText,
          style,
          images: imageUrls
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar a landing page');
      }
      
      const data = await response.json();
      
      // Verificar resposta
      if (data.success && data.data && data.data._id) {
        toast.success("Landing page gerada com sucesso!");
        
        // Limpar formulário
        setCopyText("");
        setTitle("");
        setStyle("minimalista");
        
        // Limpar imagens (sem necessidade de revogar URLs pois são URLs de servidor)
        setImages([]);
        
        // Notificar sucesso
        onSuccess(data.data._id);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error("Erro ao gerar landing page:", error);
      toast.error(`Erro ao gerar a landing page: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Importar Copy para Landing Page</h2>
        <p className="text-sm text-muted-foreground">
          Cole o texto da sua copy e adicione imagens para criar uma landing page personalizada com IA.
        </p>
      </div>
      
      {loading ? (
        <div className="border rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="font-medium text-lg mb-2">{loadingMessage}{loadingDots}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Estamos criando sua landing page com IA. Esse processo pode levar até 3 minutos.
            As páginas geradas incluem HTML, CSS e JavaScript responsivos e otimizados.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6 shadow-sm">
          {/* Título */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Título da Landing Page <span className="text-red-500">*</span>
            </Label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: Página de Vendas do Produto X"
              required
            />
          </div>
          
          {/* Upload de imagens */}
          <div className="grid gap-2">
            <Label>
              Imagens do Produto/Serviço <span className="text-xs text-muted-foreground">(Opcional, máx. 5)</span>
            </Label>
            <input 
              ref={imageInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange}
              className="hidden"
              disabled={images.length >= 5}
            />
            
            {/* Botão de upload */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={triggerFileInput}
              disabled={images.length >= 5}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {images.length === 0 
                ? "Fazer upload de imagens" 
                : `Adicionar mais imagens (${images.length}/5)`}
            </Button>
            
            {/* Preview das imagens selecionadas */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img.preview} 
                      alt={`Imagem ${index + 1}`}
                      className={`h-20 w-full object-cover rounded border ${img.error ? 'border-red-500' : ''}`}
                    />
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {img.error && (
                      <div className="absolute bottom-0 inset-x-0 bg-red-500 text-white text-xs p-1 text-center">
                        Erro
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Imagens existentes do usuário */}
            {userImages.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2 block">
                  Suas Imagens Anteriores
                </Label>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                  {loadingImages ? (
                    <div className="col-span-4 flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : userImages.length === 0 ? (
                    <p className="col-span-4 text-sm text-muted-foreground text-center py-4">
                      Nenhuma imagem encontrada
                    </p>
                  ) : (
                    userImages.map(img => (
                      <div 
                        key={img.id} 
                        className="relative cursor-pointer hover:opacity-80 transition-opacity border rounded overflow-hidden"
                        onClick={() => selectExistingImage(img)}
                      >
                        <img 
                          src={img.url} 
                          alt={img.originalname}
                          className="h-16 w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                          <Button size="sm" variant="secondary" className="h-6">
                            Usar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Área da Copy */}
          <div className="grid gap-2">
            <Label htmlFor="copyText">
              Texto da Copy <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="copyText"
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Cole aqui o texto completo da sua copy/texto de venda..."
              required
            />
          </div>
          
          {/* Estilo */}
          <div className="grid gap-2">
            <Label htmlFor="style">
              Estilo Visual
            </Label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="minimalista">Minimalista</option>
              <option value="moderno">Moderno</option>
              <option value="colorido">Colorido</option>
              <option value="corporativo">Corporativo</option>
              <option value="elegante">Elegante</option>
            </select>
          </div>
          
          {/* Botão de envio */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar e Gerar Landing Page
            </Button>
          </div>
        </form>
      )}
      
      <div className="bg-primary/10 rounded-lg p-4 text-sm">
        <h3 className="font-medium mb-2">💡 Dicas para importar copy:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Cole o texto completo da copy para melhores resultados</li>
          <li>Inclua imagens de alta qualidade para enriquecer o visual da página</li>
          <li>A IA extrairá automaticamente títulos, benefícios e chamadas para ação</li>
          <li>Revise a página gerada para garantir que todos os elementos estão corretos</li>
        </ul>
      </div>
    </div>
  );
} 