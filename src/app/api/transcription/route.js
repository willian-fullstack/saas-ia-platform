import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Função para inicializar o cliente OpenAI
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build-time',
  });
};

export async function POST(request) {
  try {
    // Extrair o formData da requisição
    const formData = await request.formData();
    const audioFile = formData.get('file');
    const language = formData.get('language') || 'pt';
    
    // Validar se o arquivo foi enviado
    if (!audioFile) {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio fornecido' }, { status: 400 });
    }
    
    // Verificar se o formato do arquivo é válido
    const validMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'video/mp4'];
    if (!validMimeTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: 'Formato de arquivo inválido. Formatos suportados: MP3, MP4, WAV, M4A' 
      }, { status: 400 });
    }
    
    // Criar um arquivo temporário para o upload
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, audioFile.name);
    
    // Obter os bytes do arquivo e salvá-lo
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);
    
    // Inicializar o cliente OpenAI
    const openai = getOpenAIClient();
    
    // Criar uma stream de leitura do arquivo
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Parâmetros para a transcrição
    const transcriptionOptions = {
      file: fileStream,
      model: 'whisper-1',
      language: language,
      response_format: 'json',
      temperature: 0.2
    };
    
    // Obter a transcrição
    const transcription = await openai.audio.transcriptions.create(transcriptionOptions);
    
    // Limpar o arquivo temporário após o uso
    fs.unlinkSync(tempFilePath);
    
    // Processar o resultado
    return NextResponse.json({ 
      text: transcription.text,
      language: language
    });
    
  } catch (error) {
    console.error('Erro na transcrição:', error);
    
    return NextResponse.json({ 
      error: 'Erro ao processar transcrição', 
      details: error.message 
    }, { status: 500 });
  }
} 