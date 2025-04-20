import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const language = formData.get('language') || 'pt'; // Padrão: português
    const format = formData.get('format') || 'default'; // Padrão: default (verbatim)
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Verificar tipo de arquivo (áudio/vídeo)
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/mpeg', 'video/webm'
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Por favor, envie um arquivo de áudio ou vídeo válido.' },
        { status: 400 }
      );
    }

    // Converter o arquivo para um buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar o arquivo temporariamente
    const tempDir = path.join(process.cwd(), 'tmp');
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = path.join(tempDir, fileName);
    
    await writeFile(filePath, buffer);

    // Definir o formato de transcrição
    let response_format = 'text';
    if (format === 'srt') {
      response_format = 'srt';
    } else if (format === 'vtt') {
      response_format = 'vtt';
    } else if (format === 'verbose_json') {
      response_format = 'verbose_json';
    }

    // Enviar para transcrição no OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: await openai.files.content(filePath),
      model: 'whisper-1',
      language: language,
      response_format: response_format,
    });

    // Retornar o resultado da transcrição
    return NextResponse.json({ 
      transcription: transcription.text,
      format: response_format
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de transcrição:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação de transcrição', details: error.message },
      { status: 500 }
    );
  }
} 