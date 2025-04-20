"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileAudio, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TranscriptionPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [language, setLanguage] = useState("pt");
  const [format, setFormat] = useState("default");
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState("");
  
  // Lidar com a seleção de arquivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/mpeg', 'video/webm'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Formato de arquivo não suportado. Por favor, envie um arquivo de áudio ou vídeo válido.");
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };
  
  // Enviar arquivo para transcrição
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Por favor, selecione um arquivo para transcrição");
      return;
    }
    
    setLoading(true);
    setTranscription("");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('format', format);
      
      const response = await fetch('/api/transcription', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar transcrição");
      }
      
      setTranscription(data.transcription);
      toast.success("Transcrição concluída com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error.message || "Falha ao processar transcrição");
    } finally {
      setLoading(false);
    }
  };
  
  // Copiar transcrição para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(transcription)
      .then(() => toast.success("Transcrição copiada para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar para a área de transferência"));
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Transcrição de Áudio e Vídeo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Faça upload de arquivos de áudio ou vídeo para transcrevê-los automaticamente.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Arraste ou selecione um arquivo de áudio ou vídeo para transcrição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload de arquivo */}
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => document.getElementById('file').click()}
                >
                  <input
                    id="file"
                    type="file"
                    accept="audio/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <FileAudio className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {fileName ? fileName : "Clique para selecionar ou arraste um arquivo"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    MP3, WAV, MP4, WEBM (máx. 25MB)
                  </p>
                </div>
              </div>
              
              {/* Seleção de idioma */}
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select 
                  value={language} 
                  onValueChange={setLanguage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                    <SelectItem value="es">Espanhol</SelectItem>
                    <SelectItem value="fr">Francês</SelectItem>
                    <SelectItem value="de">Alemão</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="ja">Japonês</SelectItem>
                    <SelectItem value="zh">Chinês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Formato de saída */}
              <div className="space-y-2">
                <Label>Formato de Saída</Label>
                <RadioGroup 
                  value={format} 
                  onValueChange={setFormat}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default">Texto Simples</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="srt" id="srt" />
                    <Label htmlFor="srt">SRT (Legendas)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vtt" id="vtt" />
                    <Label htmlFor="vtt">VTT (Web Video Text Tracks)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="verbose_json" id="verbose_json" />
                    <Label htmlFor="verbose_json">JSON Detalhado</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Botão de envio */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : "Transcrever Arquivo"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Transcrição</CardTitle>
            <CardDescription>
              Resultado da transcrição do seu arquivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={transcription}
                placeholder="A transcrição aparecerá aqui depois de processar o arquivo..."
                readOnly
                className="min-h-[300px] resize-none"
              />
              
              {transcription && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Transcrição
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 