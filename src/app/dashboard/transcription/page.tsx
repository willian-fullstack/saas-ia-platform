"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";

export default function TranscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) return;
    
    setIsLoading(true);
    setTranscription("");
    
    try {
      // Implement actual transcription API call here
      // This is a mock response for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTranscription("Esta é uma transcrição de exemplo. Em uma implementação real, este texto seria o resultado da transcrição do arquivo de áudio enviado pelo usuário.");
    } catch (error) {
      console.error("Erro na transcrição:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Transcrição de Áudio</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fazer Transcrição</CardTitle>
          <CardDescription>
            Faça upload de um arquivo de áudio para transcrevê-lo em texto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="audio">Arquivo de Áudio</Label>
                <Input 
                  id="audio" 
                  type="file" 
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="mt-4" 
              disabled={!audioFile || isLoading}
            >
              {isLoading ? <Loading /> : "Transcrever Áudio"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Transcrição</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={transcription} 
              readOnly 
              className="min-h-[200px]"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setTranscription("")}>
              Limpar
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(transcription);
              }}
            >
              Copiar Texto
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 