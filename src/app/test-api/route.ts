import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testando API DeepSeek');
    console.log('API Key:', process.env.DEEPSEEK_API_KEY?.substring(0, 5) + '...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Você é um assistente útil.' },
          { role: 'user', content: 'Diga olá' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API DeepSeek:', errorData);
      return NextResponse.json({ error: 'Erro na API DeepSeek', details: errorData }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('Resposta da API DeepSeek:', data);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao chamar a API DeepSeek:', error);
    return NextResponse.json({ error: 'Erro ao chamar a API DeepSeek', details: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
} 