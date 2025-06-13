import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDB } from '@/lib/db/connection';
import { getLandingPageModel } from '@/lib/db/models/LandingPage';
import { createDeepSiteSession } from '@/lib/db/models/DeepSiteSession';
import { hasEnoughCredits } from '@/lib/credits';
import { 
  sanitizeLandingPageHtml, 
  processLandingPageHtml, 
  addSeoMetaTags, 
  addTrackingToLandingPage 
} from './utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    const landingPages = await LandingPageModel.find({ userId: session.user.id, type: 'deepsite' })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ landingPages });
  } catch (error) {
    console.error('Erro ao buscar landing pages:', error);
    return NextResponse.json({ error: 'Erro ao buscar landing pages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar créditos
    const creditCheck = await hasEnoughCredits(session.user.id, 'landing_page');
    if (!creditCheck.hasEnough) {
      return NextResponse.json({ 
        error: 'Créditos insuficientes', 
        required: creditCheck.required,
        available: creditCheck.available
      }, { status: 402 });
    }
    
    const data = await req.json();
    
    await connectToDB();
    
    // Processar o HTML se fornecido
    let processedHtml = '';
    if (data.html) {
      processedHtml = processLandingPageHtml(data.html);
      
      // Adicionar meta tags SEO se fornecidas
      if (data.seo) {
        processedHtml = addSeoMetaTags(processedHtml, {
          title: data.seo.title,
          description: data.seo.description,
          keywords: data.seo.keywords,
          ogImage: data.seo.ogImage
        });
      }
      
      // Adicionar scripts de tracking se fornecidos
      if (data.tracking) {
        processedHtml = addTrackingToLandingPage(processedHtml, {
          googleAnalyticsId: data.tracking.googleAnalyticsId,
          facebookPixelId: data.tracking.facebookPixelId,
          customScript: data.tracking.customScript
        });
      }
    }
    
    // Criar nova sessão DeepSite
    const deepSiteSession = await createDeepSiteSession({
      userId: session.user.id,
      title: data.title || 'Nova Landing Page',
      status: 'draft',
      content: processedHtml || data.content || '',
      html: processedHtml || data.content || '',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sessão criada com sucesso',
      sessionId: deepSiteSession._id
    });
  } catch (error) {
    console.error('Erro ao criar sessão DeepSite:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão DeepSite' }, { status: 500 });
  }
} 