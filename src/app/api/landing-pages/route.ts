import { NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { getTemplateByStyle } from '@/templates/landing-page-templates';
import { writeFile } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { saveUserCreation } from "@/lib/db/models/UserCreation";

// Função para fornecer CSS padrão com base no estilo selecionado
function getDefaultCSS(style: string): string {
  // CSS base comum a todos os estilos
  const baseCSS = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Montserrat', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-bottom: 20px;
      line-height: 1.2;
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
    }
    
    h2 {
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 40px;
    }
    
    h2 span {
      color: #007bff;
    }
    
    p {
      margin-bottom: 20px;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    section {
      padding: 80px 0;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 30px;
      border-radius: 5px;
      text-decoration: none;
      text-align: center;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-large {
      padding: 15px 40px;
      font-size: 1.1rem;
      text-transform: uppercase;
    }
    
    .header {
      background-color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px 0;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 1.8rem;
      font-weight: 900;
      color: #333;
      text-decoration: none;
    }
    
    .logo span {
      color: #007bff;
    }
    
    .nav ul {
      display: flex;
      list-style: none;
    }
    
    .nav li {
      margin-left: 30px;
    }
    
    .nav a {
      color: #333;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }
    
    .hero {
      background-color: #f8f9fa;
      padding: 80px 0;
    }
    
    .hero .container {
      display: flex;
      align-items: center;
      gap: 40px;
    }
    
    .hero-content {
      flex: 1;
    }
    
    .hero-image {
      flex: 1;
      background-size: cover;
      background-position: center;
      height: 400px;
      border-radius: 10px;
      position: relative;
    }
    
    .secure-checkout {
      display: flex;
      align-items: center;
      margin-top: 20px;
      font-size: 0.9rem;
      color: #6c757d;
    }
    
    .secure-checkout i {
      margin-right: 10px;
    }
    
    .features {
      background-color: white;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    
    .feature-card {
      background-color: #f8f9fa;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform 0.3s ease;
    }
    
    .feature-icon {
      font-size: 2.5rem;
      color: #007bff;
      margin-bottom: 20px;
    }
    
    .feature-card:hover {
      transform: translateY(-10px);
    }
    
    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      counter-reset: step-counter;
    }
    
    .step {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      text-align: center;
      position: relative;
    }
    
    .step-number {
      background-color: #007bff;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      margin: 0 auto 20px;
    }
    
    .testimonials {
      background-color: #f8f9fa;
    }
    
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    
    .testimonial-card {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }
    
    .testimonial-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .client-photo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
    }
    
    .rating {
      color: #ffc107;
      font-size: 0.9rem;
    }
    
    .faq {
      background-color: white;
    }
    
    .accordion {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .accordion-item {
      margin-bottom: 15px;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid #dee2e6;
    }
    
    .accordion-header {
      background-color: #f8f9fa;
      padding: 15px 20px;
      width: 100%;
      text-align: left;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .accordion-content {
      padding: 0 20px;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background-color: white;
    }
    
    .accordion-content p {
      padding: 20px 0;
    }
    
    .accordion-item.active .accordion-content {
      max-height: 200px;
    }
    
    .footer {
      background-color: #212529;
      color: white;
      padding: 60px 0 20px;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .footer h4 {
      color: white;
      margin-bottom: 25px;
      font-size: 1.2rem;
    }
    
    .footer ul {
      list-style: none;
    }
    
    .footer li {
      margin-bottom: 10px;
    }
    
    .footer a {
      color: #adb5bd;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer a:hover {
      color: white;
    }
    
    .social-links {
      display: flex;
      gap: 15px;
      margin-top: 20px;
    }
    
    .social-links a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: rgba(255,255,255,0.1);
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }
    
    .social-links a:hover {
      background-color: #007bff;
    }
    
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin-top: 30px;
      font-size: 0.9rem;
      color: #adb5bd;
    }
    
    .countdown {
      background-color: rgba(0,123,255,0.1);
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    
    #timer, #timer2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #dc3545;
    }
    
    .offer {
      background-color: #f8f9fa;
      padding: 80px 0;
    }
    
    .offer-content {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    
    .price-box {
      margin: 30px 0;
    }
    
    .price-old {
      text-decoration: line-through;
      color: #6c757d;
      font-size: 1.2rem;
    }
    
    .price-new {
      font-size: 2.5rem;
      font-weight: 900;
      color: #28a745;
      margin: 10px 0;
    }
    
    .price-installments {
      font-size: 1rem;
      color: #6c757d;
    }
    
    .offer-badge {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background-color: rgba(40,167,69,0.1);
      color: #28a745;
      border-radius: 5px;
      font-weight: 600;
    }
    
    .offer-badge i {
      margin-right: 10px;
    }
    
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-on-scroll.animated {
      opacity: 1;
      transform: translateY(0);
    }
    
    @media (max-width: 992px) {
      .hero .container {
        flex-direction: column;
      }
      
      .hero-content, .hero-image {
        flex: none;
        width: 100%;
      }
      
      .hero-image {
        margin-top: 40px;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.7rem;
      }
    }
    
    @media (max-width: 768px) {
      .nav ul {
        display: none;
      }
      
      section {
        padding: 60px 0;
      }
    }
  `;
  
  // CSS específico para cada estilo
  switch (style.toLowerCase()) {
    case 'minimalista':
      return `${baseCSS}
        body {
          color: #444;
          background-color: #fafafa;
        }
        
        h2 span {
          color: #444;
          border-bottom: 2px solid #444;
          padding-bottom: 5px;
        }
        
        .btn-primary {
          background-color: #333;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #555;
        }
        
        .header {
          background-color: white;
        }
        
        .logo span {
          color: #333;
        }
        
        .feature-icon {
          color: #333;
        }
        
        .step-number {
          background-color: #333;
        }
        
        .footer {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .footer h4 {
          color: #333;
        }
        
        .footer a {
          color: #555;
        }
        
        .social-links a:hover {
          background-color: #333;
        }
        
        .footer-bottom {
          color: #777;
        }
      `;
      
    case 'moderno':
      return `${baseCSS}
        body {
          background-color: #f8f9fa;
        }
        
        h2 {
          position: relative;
        }
        
        h2:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(to right, #007bff, #6610f2);
        }
        
        h2 span {
          color: #6610f2;
        }
        
        .btn-primary {
          background: linear-gradient(to right, #007bff, #6610f2);
          border: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .hero {
          position: relative;
          overflow: hidden;
        }
        
        .hero:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0,123,255,0.1) 0%, rgba(102,16,242,0.1) 100%);
          z-index: 0;
        }
        
        .hero .container {
          position: relative;
          z-index: 1;
        }
        
        .feature-card {
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.03);
        }
        
        .feature-icon {
          background: linear-gradient(to right, #007bff, #6610f2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .step {
          border-radius: 20px;
        }
        
        .step-number {
          background: linear-gradient(to right, #007bff, #6610f2);
        }
        
        .testimonial-card {
          border-radius: 20px;
        }
      `;
      
    case 'corporativo':
      return `${baseCSS}
        body {
          color: #333;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        
        h2 span {
          color: #003366;
        }
        
        .btn-primary {
          background-color: #003366;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #004080;
        }
        
        .header {
          background-color: white;
        }
        
        .logo span {
          color: #003366;
        }
        
        .nav a:hover {
          color: #003366;
        }
        
        .hero {
          background-color: #f2f5f9;
        }
        
        .feature-icon {
          color: #003366;
        }
        
        .feature-card {
          border: 1px solid #e0e0e0;
        }
        
        .step-number {
          background-color: #003366;
        }
        
        .testimonial-card {
          border: 1px solid #e0e0e0;
        }
        
        .accordion-header {
          background-color: #f2f5f9;
        }
        
        .footer {
          background-color: #003366;
        }
        
        .social-links a:hover {
          background-color: #004080;
        }
      `;
      
    case 'vendas':
    default:
      return `${baseCSS}
        h2 span {
          color: #ff5722;
        }
        
        .btn-primary {
          background-color: #ff5722;
          color: white;
          box-shadow: 0 5px 15px rgba(255,87,34,0.3);
        }
        
        .btn-primary:hover {
          background-color: #e64a19;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255,87,34,0.4);
        }
        
        .logo span {
          color: #ff5722;
        }
        
        .hero {
          background: linear-gradient(to right, #f8f9fa, #fbe9e7);
        }
        
        .hero-badge {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 20px 0;
        }
        
        .badge-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .badge-item i {
          color: #ff5722;
        }
        
        .product-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: #ff5722;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .feature-icon {
          color: #ff5722;
        }
        
        .step-number {
          background-color: #ff5722;
        }
        
        .countdown {
          background-color: rgba(255,87,34,0.1);
          border: 2px dashed rgba(255,87,34,0.3);
        }
        
        .price-new {
          color: #ff5722;
        }
        
        .offer-badge {
          background-color: rgba(255,87,34,0.1);
          color: #ff5722;
          border: 2px dashed rgba(255,87,34,0.3);
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .btn-primary {
          animation: pulse 2s infinite;
        }
      `;
  }
}

// Função para fornecer JavaScript padrão
function getDefaultJS(): string {
  return `
    // Esperar o carregamento do DOM
    document.addEventListener('DOMContentLoaded', function() {
      // Contador regressivo
      function startCountdown() {
        const counters = ['timer', 'timer2'];
        
        counters.forEach(timerId => {
          if (!document.getElementById(timerId)) return;
          
          const hoursElement = document.getElementById('hours' + (timerId === 'timer' ? '' : '2'));
          const minutesElement = document.getElementById('minutes' + (timerId === 'timer' ? '' : '2'));
          const secondsElement = document.getElementById('seconds' + (timerId === 'timer' ? '' : '2'));
          
          if (!hoursElement || !minutesElement || !secondsElement) return;
          
          let hours = parseInt(hoursElement.innerText);
          let minutes = parseInt(minutesElement.innerText);
          let seconds = parseInt(secondsElement.innerText);
          
          const interval = setInterval(function() {
            seconds--;
            
            if (seconds < 0) {
              seconds = 59;
              minutes--;
              
              if (minutes < 0) {
                minutes = 59;
                hours--;
                
                if (hours < 0) {
                  clearInterval(interval);
                  hours = 0;
                  minutes = 0;
                  seconds = 0;
                }
              }
            }
            
            hoursElement.innerText = hours.toString().padStart(2, '0');
            minutesElement.innerText = minutes.toString().padStart(2, '0');
            secondsElement.innerText = seconds.toString().padStart(2, '0');
          }, 1000);
        });
      }
      
      // Iniciar o contador
      startCountdown();
      
      // Accordion para FAQs
      const accordionItems = document.querySelectorAll('.accordion-item');
      
      accordionItems.forEach(function(item) {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        
        if (header && content) {
          header.addEventListener('click', function() {
            // Fechar todos os outros acordeões
            accordionItems.forEach(function(otherItem) {
              if (otherItem !== item) {
                otherItem.classList.remove('active');
                const otherContent = otherItem.querySelector('.accordion-content');
                if (otherContent) {
                  otherContent.style.maxHeight = null;
                }
              }
            });
            
            // Alternar o atual
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
              content.style.maxHeight = content.scrollHeight + 'px';
            } else {
              content.style.maxHeight = null;
            }
          });
        }
      });
      
      // Animação ao scroll
      const animateElements = document.querySelectorAll('.animate-on-scroll');
      
      function checkIfInView() {
        animateElements.forEach(function(element) {
          const elementTop = element.getBoundingClientRect().top;
          const elementVisible = 150;
          
          if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animated');
          }
        });
      }
      
      // Verificar elementos visíveis no carregamento
      checkIfInView();
      
      // Verificar elementos visíveis ao rolar
      window.addEventListener('scroll', checkIfInView);
      
      // Rolagem suave para links âncora
      const anchorLinks = document.querySelectorAll('a[href^="#"]');
      
      anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        });
      });
      
      // Animação para os botões CTA
      const ctaButtons = document.querySelectorAll('.btn-primary');
      
      ctaButtons.forEach(function(button) {
        button.addEventListener('mouseover', function() {
          this.style.transform = 'translateY(-5px)';
          this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)';
        });
        
        button.addEventListener('mouseout', function() {
          this.style.transform = '';
          this.style.boxShadow = '';
        });
      });
    });
  `;
}

// Função para chamar a API DeepSeek
async function callDeepSeekAPI(prompt: string, mode: 'separated' | 'combined' = 'separated'): Promise<any> {
  try {
    console.log("Iniciando chamada à API DeepSeek...");
    
    // Obter a chave da API do ambiente
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("Chave da API DeepSeek não configurada");
    }
    
    // Definir os parâmetros da chamada
    const apiUrl = "https://api.deepseek.com/v1/chat/completions";
    const requestData = {
      model: "deepseek-coder-v2",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em desenvolver landing pages profissionais com HTML, CSS e JavaScript. Seu objetivo é criar landing pages de alto impacto visual, com design profissional e elementos interativos que aumentam a taxa de conversão."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 15000,
      temperature: 0.7,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
      stream: false
    };
    
    // Configuração da requisição
    const requestOptions = {
      method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    };
    
    console.log("Enviando requisição para API DeepSeek...");
    console.log("Tamanho do prompt:", prompt.length, "caracteres");
    
    // Fazer a requisição à API
    const response = await fetch(apiUrl, requestOptions);
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Erro na resposta da API:", response.status, response.statusText);
      console.error("Detalhes do erro:", errorData);
      
      // Se for um erro de conteúdo filtrado, tentar novamente com um prompt ajustado
      if (response.status === 400 && errorData?.error?.message?.includes('content filtered')) {
        console.log("Conteúdo filtrado. Tentando novamente com prompt ajustado...");
        
        // Ajustar o prompt para evitar filtros
        const adjustedPrompt = prompt
          .replace(/vendas/gi, "apresentação")
          .replace(/comprar/gi, "adquirir")
          .replace(/preço/gi, "valor")
          .replace(/pagamento/gi, "aquisição")
          .replace(/dinheiro/gi, "investimento")
          .replace(/desconto/gi, "vantagem");
        
        // Nova requisição com prompt ajustado
        const newRequestData = {
          ...requestData,
          messages: [
            requestData.messages[0],
            {
              role: "user",
              content: adjustedPrompt
            }
          ],
          temperature: 0.5 // Reduzir temperatura para conteúdo mais seguro
        };
        
        const newRequestOptions = {
          ...requestOptions,
          body: JSON.stringify(newRequestData)
        };
        
        console.log("Enviando nova requisição com prompt ajustado...");
        const newResponse = await fetch(apiUrl, newRequestOptions);
        
        if (!newResponse.ok) {
          throw new Error(`Falha na segunda tentativa: ${newResponse.status} ${newResponse.statusText}`);
        }
        
        const newResponseData = await newResponse.json();
        
        if (!newResponseData.choices || newResponseData.choices.length === 0) {
          throw new Error("A API retornou uma resposta vazia na segunda tentativa");
        }
        
        console.log("Resposta recebida da segunda tentativa");
        const content = newResponseData.choices[0].message.content;
        
        // Processar o conteúdo recebido
        return await processAPIResponse(content, mode);
      }
      
      throw new Error(`Erro na chamada da API: ${response.status} ${response.statusText}`);
    }
    
    // Processar a resposta da API
    const responseData = await response.json();
    
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error("A API retornou uma resposta vazia");
    }
    
    console.log("Resposta recebida da API DeepSeek");
    const content = responseData.choices[0].message.content;
    
    // Processar o conteúdo recebido
    return await processAPIResponse(content, mode);
  } catch (error) {
    console.error("Erro ao chamar a API DeepSeek:", error);
    return null;
  }
}

// Função para processar a resposta da API
async function processAPIResponse(content: string, mode: 'separated' | 'combined'): Promise<any> {
  try {
    console.log("Processando resposta da API...");
    console.log("Tamanho da resposta:", content.length, "caracteres");
    
    // Extrair os arquivos separados
    const separatedFiles = extractSeparatedFiles(content);
    
    if (!separatedFiles) {
      throw new Error("Não foi possível extrair os arquivos da resposta");
    }
    
    // Verificar se os arquivos extraídos têm conteúdo significativo
    console.log("Tamanhos dos arquivos extraídos:");
    console.log("HTML:", separatedFiles.html.length, "caracteres");
    console.log("CSS:", separatedFiles.css.length, "caracteres");
    console.log("JS:", separatedFiles.js.length, "caracteres");
    
    if (separatedFiles.html.length < 100) {
      throw new Error("HTML extraído muito pequeno");
    }
    
    // Combinar os arquivos em um HTML unificado
    const combinedHTML = createUnifiedHTML(separatedFiles.html, separatedFiles.css, separatedFiles.js);
    
    // Retornar conforme o modo solicitado
    if (mode === 'separated') {
      return {
        separatedFiles,
        combined: combinedHTML
      };
    } else {
      return combinedHTML;
    }
  } catch (error) {
    console.error("Erro ao processar a resposta da API:", error);
    return null;
  }
}

// Função para processar a resposta quando os arquivos não são extraídos corretamente
async function processResponse(content: string): Promise<string> {
  try {
    // Tentar extrair usando a função principal
    const separatedFiles = extractSeparatedFiles(content);
    
    if (separatedFiles) {
      return createUnifiedHTML(separatedFiles.html, separatedFiles.css, separatedFiles.js);
    }
    
    // Fallback: criar um HTML básico com o conteúdo recebido
    console.log("Usando fallback para processamento da resposta");
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    ${getDefaultCSS("vendas")}
  </style>
</head>
<body>
  <div class="content-wrapper">
    ${content}
  </div>
  <script>
    ${getDefaultJS()}
  </script>
</body>
</html>`;
  } catch (error) {
    console.error("Erro ao processar resposta:", error);
    return `<!DOCTYPE html><html><body><h1>Erro ao gerar landing page</h1><p>${error}</p></body></html>`;
  }
}

// Função para extrair HTML, CSS e JS de uma resposta completa
function extractSeparatedFiles(content: string): { html: string, css: string, js: string } | null {
  try {
    console.log("Iniciando extração de arquivos da resposta...");
    
    // Padrões para extrair os blocos de código - adicionando mais variações
    const htmlPattern = /```(?:html|HTML)[\s\n]*([\s\S]*?)```/i;
    const cssPattern = /```(?:css|CSS)[\s\n]*([\s\S]*?)```/i;
    const jsPattern = /```(?:javascript|js|JavaScript|JS)[\s\n]*([\s\S]*?)```/i;
    
    // Padrões alternativos para casos onde o modelo não formatou corretamente
    const htmlFallbackPattern = /<html[\s\S]*?<\/html>/i;
    const cssFallbackPattern = /<style>([\s\S]*?)<\/style>/i;
    const jsFallbackPattern = /<script>([\s\S]*?)<\/script>/i;
    
    // Tentar extrair com os padrões principais
    let htmlMatch = content.match(htmlPattern);
    let cssMatch = content.match(cssPattern);
    let jsMatch = content.match(jsPattern);
    
    console.log("Encontrou HTML com padrão principal:", !!htmlMatch);
    console.log("Encontrou CSS com padrão principal:", !!cssMatch);
    console.log("Encontrou JS com padrão principal:", !!jsMatch);
    
    // Se não encontrou CSS ou JS com os padrões principais, tentar com os alternativos
    if (!cssMatch && content.includes('<style>')) {
      console.log("Tentando extrair CSS com padrão alternativo");
      cssMatch = content.match(cssFallbackPattern);
      console.log("Encontrou CSS com padrão alternativo:", !!cssMatch);
    }
    
    if (!jsMatch && content.includes('<script>')) {
      console.log("Tentando extrair JS com padrão alternativo");
      jsMatch = content.match(jsFallbackPattern);
      console.log("Encontrou JS com padrão alternativo:", !!jsMatch);
    }
    
    // Se não encontrou HTML com o padrão principal, tentar com o alternativo
    if (!htmlMatch && content.includes('<html')) {
      console.log("Tentando extrair HTML com padrão alternativo");
      htmlMatch = content.match(htmlFallbackPattern);
      console.log("Encontrou HTML com padrão alternativo:", !!htmlMatch);
    }
    
    // Verificar se encontrou pelo menos HTML
    if (!htmlMatch) {
      console.error("Não foi possível encontrar o HTML no conteúdo");
      console.log("Fragmento da resposta:", content.substring(0, 500));
      
      // Última tentativa desesperada para extrair algo
      if (content.includes('<body') || content.includes('<div')) {
        console.log("Tentando extrair conteúdo HTML básico");
        const basicHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
</head>
<body>
  ${content}
</body>
</html>`;
        
        // Buscar qualquer CSS ou JS em linha que possa existir
        const inlineCSS = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        const inlineJS = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        
        let extractedCSS = "/* Estilos para a landing page */\n";
        let extractedJS = "// JavaScript para a landing page\n";
        
        if (inlineCSS) {
          inlineCSS.forEach(style => {
            const cssContent = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
            if (cssContent && cssContent[1]) {
              extractedCSS += cssContent[1] + "\n";
            }
          });
        }
        
        if (inlineJS) {
          inlineJS.forEach(script => {
            const jsContent = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            if (jsContent && jsContent[1]) {
              extractedJS += jsContent[1] + "\n";
            }
          });
        }
        
        return {
          html: basicHtml,
          css: extractedCSS,
          js: extractedJS
        };
      }
      
      return null;
    }
    
    // Extrair o conteúdo dos blocos
    let html = htmlMatch[1] ? htmlMatch[1].trim() : "";
    
    // Verificar se o CSS e JS têm tamanho mínimo e qualidade suficiente
    let css = "";
    let js = "";
    
    const CSS_MIN_SIZE = 500; // Tamanho mínimo para CSS ser considerado válido
    const JS_MIN_SIZE = 300;  // Tamanho mínimo para JS ser considerado válido
    
    // Verificar CSS
    if (cssMatch && cssMatch[1]) {
      const extractedCSS = cssMatch[1].trim();
      if (extractedCSS.length > CSS_MIN_SIZE && 
          (extractedCSS.includes("body") || extractedCSS.includes(".container") || extractedCSS.includes("@media"))) {
        console.log("CSS válido encontrado com tamanho:", extractedCSS.length);
        css = extractedCSS;
      } else {
        console.log("CSS extraído parece incompleto (tamanho:", extractedCSS.length, "). Usando CSS padrão");
        css = getDefaultCSS("vendas");
      }
    } else {
      console.log("Nenhum CSS encontrado. Usando CSS padrão");
      css = getDefaultCSS("vendas");
    }
    
    // Verificar JS
    if (jsMatch && jsMatch[1]) {
      const extractedJS = jsMatch[1].trim();
      if (extractedJS.length > JS_MIN_SIZE && 
          (extractedJS.includes("function") || extractedJS.includes("addEventListener") || extractedJS.includes("document."))) {
        console.log("JavaScript válido encontrado com tamanho:", extractedJS.length);
        js = extractedJS;
      } else {
        console.log("JavaScript extraído parece incompleto (tamanho:", extractedJS.length, "). Usando JS padrão");
        js = getDefaultJS();
      }
    } else {
      console.log("Nenhum JavaScript encontrado. Usando JS padrão");
      js = getDefaultJS();
    }
    
    // Verificar se o HTML está completo (tem as tags html, head e body)
    if (!html.includes('<html') || !html.includes('</html>')) {
      html = `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Landing Page</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
    }
    
    console.log("Extração de arquivos concluída com sucesso");
    console.log("Tamanhos: HTML:", html.length, "CSS:", css.length, "JS:", js.length);
    
    return { html, css, js };
    } catch (error) {
    console.error("Erro ao extrair os arquivos separados:", error);
    return null;
  }
}

// Função para combinar HTML, CSS e JS em um único arquivo
function combineFiles(html: string, css: string, js: string): string {
  try {
    // Verificar se o HTML já tem as tags style e script
    const hasStyleTag = html.includes('<style>');
    const hasScriptTag = html.includes('<script>') && !html.includes('<script src=');
    
    // Se o HTML já tiver tags style e script, verificar se estão completas
    if (hasStyleTag && hasScriptTag && 
        html.includes('</style>') && html.includes('</script>')) {
      return html;
    }
    
    // Usar a função unificada para combinar os arquivos corretamente
    return createUnifiedHTML(html, css, js);
  } catch (error) {
    console.error("Erro ao combinar arquivos:", error);
    return createUnifiedHTML(html, css, js);
  }
}

function createUnifiedHTML(html: string, css: string, js: string): string {
  try {
    // Melhorar o estilo do FAQ para garantir que botões de pergunta tenham estilo adequado
    const enhancedCSS = css + `
/* Melhorias para FAQ */
.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.faq-question:hover {
  background-color: #e9ecef;
}

.faq-question i, 
.faq-question svg {
  transition: transform 0.3s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.faq-question.active i,
.faq-question.active svg {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  display: none;
  background-color: #fff;
}

.faq-answer.visible {
  display: block;
}

/* Estilos para outros componentes de acordeão que possam existir */
.accordion-item {
  margin-bottom: 1rem;
}

.accordion-header {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.accordion-content {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  background-color: #fff;
}

/* Garantir que imagens sejam corretamente exibidas */
img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 0.25rem;
  display: block;
  margin: 0 auto;
}

img[src^="http"],
img[src^="/"] {
  display: block;
}

img:not([src]),
img[src=""],
img[src="#"],
img[alt="placeholder"] {
  display: none;
}

/* Melhorar estilo geral de texto */
body {
  font-family: 'Montserrat', 'Poppins', sans-serif;
  line-height: 1.7;
  color: #333;
  font-size: 16px;
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
}

p {
  margin-bottom: 1.5rem;
}

strong, b {
  font-weight: 700;
}

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
`;

    // Melhorar o JavaScript para o FAQ e correção de imagens
    const enhancedJS = js + `
// Garante que o script para FAQ funcione corretamente
document.addEventListener('DOMContentLoaded', function() {
  // Gerenciar botões de FAQ
  const faqButtons = document.querySelectorAll('.faq-question');
  
  if (faqButtons.length > 0) {
    console.log('FAQ buttons found:', faqButtons.length);
    
    faqButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('FAQ button clicked');
        
        // Toggle classe active no botão
        this.classList.toggle('active');
        
        // Encontrar o elemento de resposta correspondente
        const answer = this.nextElementSibling;
        if (answer && (answer.classList.contains('faq-answer') || answer.classList.contains('accordion-content'))) {
          console.log('Toggling answer visibility');
          answer.classList.toggle('visible');
          
          // Se não tem a classe visible, usar max-height para animação
          if (answer.classList.contains('accordion-content')) {
            if (answer.style.maxHeight) {
              answer.style.maxHeight = null;
            } else {
              answer.style.maxHeight = answer.scrollHeight + "px";
            }
          }
        } else {
          console.log('Answer element not found or does not have correct class');
        }
      });
    });
  } else {
    console.log('No FAQ buttons found on page');
    
    // Tenta encontrar outros tipos de elementos FAQ
    const altFaqButtons = document.querySelectorAll('[class*="faq"]:not(.faq-answer), [class*="accordion"]:not(.accordion-content), [class*="collapse-trigger"]');
    if (altFaqButtons.length > 0) {
      console.log('Alternative FAQ buttons found:', altFaqButtons.length);
      
      altFaqButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          const nextEl = this.nextElementSibling;
          if (nextEl) {
            if (nextEl.style.display === 'none' || nextEl.style.display === '') {
              nextEl.style.display = 'block';
            } else {
              nextEl.style.display = 'none';
            }
          }
        });
      });
    }
  }
  
  // Gerenciar também accordions padrão
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  if (accordionHeaders.length > 0) {
    console.log('Accordion headers found:', accordionHeaders.length);
    
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Accordion header clicked');
        
        // Toggle classe active no header
        this.classList.toggle('active');
        
        // Encontrar o conteúdo correspondente
        const content = this.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          if (content.style.maxHeight) {
            content.style.maxHeight = null;
          } else {
            content.style.maxHeight = content.scrollHeight + "px";
          }
        }
      });
    });
  }
  
  // Verificar e corrigir URLs de imagens quebradas
  const images = document.querySelectorAll('img');
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"%3E%3Crect fill="%23f0f0f0" width="300" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="30" dy=".3em" text-anchor="middle" x="150" y="75"%3EImagem%3C/text%3E%3C/svg%3E';
  
  console.log('Processing images:', images.length);
  
  images.forEach(img => {
    // Garantir que os caminhos das imagens sejam absolutos
    if (img.src && img.src.startsWith('/uploads/')) {
      console.log('Converting relative path to absolute:', img.src);
      const currentOrigin = window.location.origin;
      img.src = currentOrigin + img.src;
      console.log('New image path:', img.src);
    }
    
    // Substituir imagem quebrada por placeholder
    img.onerror = function() {
      console.log('Image failed to load:', this.src);
      this.src = placeholderImage;
      this.style.maxWidth = '300px';
      this.style.maxHeight = '150px';
    };
    
    // Se a imagem não tem src ou tem src inválida, usar placeholder
    if (!img.getAttribute('src') || 
        img.getAttribute('src') === '#' || 
        img.getAttribute('src') === '' ||
        img.getAttribute('src').includes('placeholder.com')) {
      console.log('Image has invalid source:', img.getAttribute('src'));
      img.src = placeholderImage;
      img.style.maxWidth = '300px';
      img.style.maxHeight = '150px';
    }
  });
  
  // Animar elementos ao scroll
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  
  function checkScroll() {
    animateElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('animated');
      }
    });
  }
  
  // Verificar elementos no carregamento e ao scroll
  if (animateElements.length > 0) {
    checkScroll();
    window.addEventListener('scroll', checkScroll);
  }
  
  // Adicionar botões para download dos arquivos separados
  const addDownloadButtons = () => {
    // Verificar se já existe um container de download
    if (document.querySelector('.download-container')) {
      return;
    }
    
    // Criar container para os botões de download
    const downloadContainer = document.createElement('div');
    downloadContainer.className = 'download-container';
    downloadContainer.style.position = 'fixed';
    downloadContainer.style.bottom = '20px';
    downloadContainer.style.right = '20px';
    downloadContainer.style.zIndex = '9999';
    downloadContainer.style.background = '#fff';
    downloadContainer.style.padding = '10px';
    downloadContainer.style.borderRadius = '5px';
    downloadContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    downloadContainer.style.display = 'flex';
    downloadContainer.style.flexDirection = 'column';
    downloadContainer.style.gap = '5px';
    
    // Botão para baixar HTML
    const downloadHtmlBtn = document.createElement('button');
    downloadHtmlBtn.textContent = 'Baixar HTML';
    downloadHtmlBtn.className = 'download-btn';
    downloadHtmlBtn.style.padding = '8px 12px';
    downloadHtmlBtn.style.border = 'none';
    downloadHtmlBtn.style.borderRadius = '4px';
    downloadHtmlBtn.style.background = '#007bff';
    downloadHtmlBtn.style.color = '#fff';
    downloadHtmlBtn.style.cursor = 'pointer';
    downloadHtmlBtn.style.fontSize = '14px';
    downloadHtmlBtn.onclick = () => downloadFile('html');
    
    // Botão para baixar CSS
    const downloadCssBtn = document.createElement('button');
    downloadCssBtn.textContent = 'Baixar CSS';
    downloadCssBtn.className = 'download-btn';
    downloadCssBtn.style.padding = '8px 12px';
    downloadCssBtn.style.border = 'none';
    downloadCssBtn.style.borderRadius = '4px';
    downloadCssBtn.style.background = '#28a745';
    downloadCssBtn.style.color = '#fff';
    downloadCssBtn.style.cursor = 'pointer';
    downloadCssBtn.style.fontSize = '14px';
    downloadCssBtn.onclick = () => downloadFile('css');
    
    // Botão para baixar JS
    const downloadJsBtn = document.createElement('button');
    downloadJsBtn.textContent = 'Baixar JS';
    downloadJsBtn.className = 'download-btn';
    downloadJsBtn.style.padding = '8px 12px';
    downloadJsBtn.style.border = 'none';
    downloadJsBtn.style.borderRadius = '4px';
    downloadJsBtn.style.background = '#ffc107';
    downloadJsBtn.style.color = '#000';
    downloadJsBtn.style.cursor = 'pointer';
    downloadJsBtn.style.fontSize = '14px';
    downloadJsBtn.onclick = () => downloadFile('js');
    
    // Adicionar botões ao container
    downloadContainer.appendChild(downloadHtmlBtn);
    downloadContainer.appendChild(downloadCssBtn);
    downloadContainer.appendChild(downloadJsBtn);
    
    // Adicionar container ao body
    document.body.appendChild(downloadContainer);
  };
  
  // Função para extrair e baixar os arquivos
  const downloadFile = (type) => {
    let content;
    let filename;
    
    // Extrair o conteúdo baseado no tipo
    if (type === 'html') {
      // Extrair HTML (sem head e sem script e style inline)
      let htmlClone = document.documentElement.cloneNode(true);
      let headElement = htmlClone.querySelector('head');
      let bodyElement = htmlClone.querySelector('body');
      
      // Remover scripts inline
      Array.from(bodyElement.querySelectorAll('script')).forEach(script => {
        script.parentNode.removeChild(script);
      });
      
      // Adicionar links para CSS e JS
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = 'styles.css';
      
      const scriptTag = document.createElement('script');
      scriptTag.src = 'script.js';
      scriptTag.defer = true;
      
      // Limpar head existente, mantendo meta tags
      Array.from(headElement.children).forEach(child => {
        if (child.tagName !== 'META' && child.tagName !== 'TITLE') {
          child.remove();
        }
      });
      
      headElement.appendChild(styleLink);
      bodyElement.appendChild(scriptTag);
      
      content = '<!DOCTYPE html>\\n' + htmlClone.outerHTML;
      filename = 'index.html';
    }
    
    else if (type === 'css') {
      // Extrair CSS dos estilos inline
      const styleElements = document.querySelectorAll('style');
      content = '';
      
      styleElements.forEach(style => {
        content += style.textContent + '\\n\\n';
      });
      
      filename = 'styles.css';
    }
    
    else if (type === 'js') {
      // Extrair JS dos scripts inline
      const scriptElements = document.querySelectorAll('script:not([src])');
      content = '';
      
      scriptElements.forEach(script => {
        content += script.textContent + '\\n\\n';
      });
      
      filename = 'script.js';
    }
    
    // Criar e baixar o arquivo
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Adicionar botões de download após carregar a página
  setTimeout(addDownloadButtons, 1000);
});
`;

    // Construir o HTML completo com o CSS e JS aprimorados
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
${enhancedCSS}
  </style>
</head>
<body>
  ${html}
  <script>
${enhancedJS}
  </script>
</body>
</html>`;
  } catch (error) {
    console.error("Erro ao criar HTML unificado:", error);
    
    // Em caso de erro, retornar um HTML básico com o conteúdo original
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
${css}
  </style>
</head>
<body>
  ${html}
  <script>
${js}
  </script>
</body>
</html>`;
  }
}

// Rota principal para geração de landing pages
export async function POST(request: Request) {
  try {
    // Início do tempo de execução
    const startTime = performance.now();
  
    let niche, product, benefits, targetAudience, callToAction, testimonials, pricing, style, separateFiles;
    let productImageUrl = null;
    
    // Verificar o tipo de conteúdo da requisição
    const contentType = request.headers.get('content-type') || '';
    
    // Se for multipart form-data, processar o upload de imagem
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Obter os dados JSON da requisição
      const jsonData = formData.get('data');
      if (!jsonData || typeof jsonData !== 'string') {
        throw new Error('Dados JSON não encontrados na requisição');
      }
      
      const parsedData = JSON.parse(jsonData);
      
      // Extrair os dados da requisição
      niche = parsedData.niche;
      product = parsedData.product;
      benefits = parsedData.benefits;
      targetAudience = parsedData.targetAudience;
      callToAction = parsedData.callToAction;
      testimonials = parsedData.testimonials;
      pricing = parsedData.pricing;
      style = parsedData.style;
      separateFiles = parsedData.separateFiles;
      
      // Processar a imagem do produto, se houver
      const productImage = formData.get('productImage');
      if (productImage && productImage instanceof Blob) {
        try {
          // Criar um diretório para armazenar a imagem (se não existir)
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          
          // Verificar se o diretório existe, senão criar
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`Diretório de uploads criado: ${uploadsDir}`);
          }
          
          // Gerar um nome único para o arquivo
          const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
          const filePath = path.join(uploadsDir, fileName);
          
          // Converter Blob para ArrayBuffer
          const buffer = Buffer.from(await productImage.arrayBuffer());
          
          // Gravar o arquivo
          await writeFile(filePath, buffer);
          
          // URL para acessar a imagem - usar URL absoluta
          productImageUrl = `/uploads/${fileName}`;
          
          console.log(`Imagem do produto salva em: ${filePath}`);
        } catch (error) {
          console.error('Erro ao processar imagem do produto:', error);
        }
      }
    } else {
      // Caso seja application/json
      const requestData = await request.json();
      
      // Extrair os dados da requisição
      niche = requestData.niche;
      product = requestData.product;
      benefits = requestData.benefits;
      targetAudience = requestData.targetAudience;
      callToAction = requestData.callToAction;
      testimonials = requestData.testimonials;
      pricing = requestData.pricing;
      style = requestData.style;
      separateFiles = requestData.separateFiles;
    }

    console.log("Recebida solicitação de nova landing page:", {
      niche: niche || "[não informado]",
      product: product || "[não informado]",
      style: style || "moderno",
      benefits: benefits ? benefits.length : 0,
      separateFiles: separateFiles === true,
      hasProductImage: Boolean(productImageUrl)
    });

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("API key não configurada");
    }

    // Valores padrão se os campos estiverem indefinidos
    const safeNiche = niche || "Produto Digital";
    const safeProduct = product || "Produto Incrível";
    const safeStyle = style || "moderno";
    const safeBenefits = benefits && benefits.length > 0 ? benefits : ["Qualidade superior", "Resultados comprovados", "Satisfação garantida"];
    const safeTargetAudience = targetAudience || "Pessoas interessadas em melhorar sua qualidade de vida";
    const safeCallToAction = callToAction || "Comprar Agora";
    const safePricing = pricing || "R$ 197,00";
    const includeTestimonials = testimonials !== false;

    // Construir prompt com contexto detalhado e melhor diferenciação entre estilos
    const promptContext = `
Você é um desenvolvedor web sênior especializado na criação de landing pages profissionais de alta conversão, com habilidades avançadas em HTML5, CSS3 e JavaScript moderno. Você cria designs visuais impressionantes e código funcional específico para o nicho e produto solicitados.

TAREFA:
Crie uma landing page completa e altamente persuasiva para o seguinte produto/serviço:

- Nicho: "${safeNiche}"
- Nome do produto/serviço: "${safeProduct}"
- Público-alvo: "${safeTargetAudience}"
- Call to Action: "${safeCallToAction}"
- Preço/Oferta: "${safePricing}"
- Estilo visual: "${safeStyle}"
- Benefícios principais:
${safeBenefits.map((b: string) => `  * ${b}`).join('\n')}
${productImageUrl ? `- Imagem do produto: "${productImageUrl}" (use esta URL para a imagem principal do produto)` : ''}

IMPORTANTE - ENTREGUE O CÓDIGO COMO SOLICITADO:
${separateFiles ? 
`Entregue em TRÊS PARTES SEPARADAS:
1. HTML (use a tag \`\`\`html no início e \`\`\` no final)
2. CSS (use a tag \`\`\`css no início e \`\`\` no final)
3. JavaScript (use a tag \`\`\`javascript no início e \`\`\` no final)` 
: 
`Entregue como UM DOCUMENTO HTML COMPLETO com CSS no <style> e JS no <script>`}

DIRETRIZES PARA O HTML:
- Utilize HTML5 semântico e acessível (schema.org para SEO)
- A página deve focar especificamente no produto "${safeProduct}" para o nicho "${safeNiche}"
- TODOS os textos devem ser personalizados para o produto em questão, não use textos genéricos
- A página deve incluir: header com navegação, seção hero atraente, lista de benefícios com ícones, ${includeTestimonials ? 'seção de depoimentos,' : ''} seção "como funciona", garantia/credibilidade, CTA principal (usando "${safeCallToAction}"), FAQs e footer
- Crie botões de CTA chamativos com senso de urgência/escassez
${includeTestimonials ? '- Inclua pelo menos 3 depoimentos fictícios persuasivos com nomes, fotos e avaliações' : ''}
- Adicione contador regressivo para FOMO (medo de perder)
- Use microcopy persuasivo direcionado ao público "${safeTargetAudience}"
- Incorpore ícones do Font Awesome e pelo menos uma fonte do Google
- Garanta que o HTML seja estruturado para receber os estilos CSS
- Destaque claramente o preço/oferta: "${safePricing}"
${productImageUrl ? `- Utilize a imagem do produto em posição de destaque (URL: "${productImageUrl}")` : '- Adicione marcadores para imagens de produto fictícias'}

DIFERENCIAIS VISUAIS POR ESTILO:
${safeStyle === 'minimalista' ? `
ESTILO MINIMALISTA:
- Paleta de cores: Preto (#111), branco (#fff) e cinza claro (#f8f8f8) com acento sutil em APENAS UMA cor
- Tipografia: Fonte sans-serif minimalista como Inter ou Helvetica Neue
- Layout: Muito espaço em branco com poucos elementos por seção
- Elementos visuais: Ícones simples de linha fina, sem gradientes ou sombras fortes
- Botões: Botões com bordas finas e sem preenchimento ou com preenchimento sutil
- Imagens: Imagens com tratamento monocromático ou duotone discreto
- Design: Simplicidade extrema, alinhamentos precisos, sem elementos decorativos
- JavaScript: Animações sutis e minimalistas apenas em hovers` : ''}

${safeStyle === 'moderno' ? `
ESTILO MODERNO:
- Paleta de cores: Gradientes sutis de azul (#3B82F6 a #2563EB) com toques de roxo (#8B5CF6)
- Tipografia: Combinação de fontes contemporâneas com bom contraste (ex: Montserrat e Poppins)
- Layout: Seções assimétricas, sobreposições de elementos e uso de formas geométricas
- Elementos visuais: Cards com sombras expressivas, gradientes suaves, ícones bi-color
- Botões: Botões com gradiente e efeitos de hover refinados
- Imagens: Imagens com tratamento contemporâneo, com filtros e efeitos de camadas
- Design: Elementos flutuantes, globos ou partículas de fundo, layouts sobrepostos
- JavaScript: Animações de scroll suaves e efeitos parallax` : ''}

${safeStyle === 'vendas' ? `
ESTILO VENDAS:
- Paleta de cores: Contrastes fortes com vermelho (#DC2626) e amarelo (#FBBF24) para elementos de urgência
- Tipografia: Tipografia impactante com headlines grandes e em negrito
- Layout: Fluxo vertical contínuo direcionado para múltiplos CTAs
- Elementos visuais: Selos de garantia, badges "oferta limitada", ícones de destaque
- Botões: CTAs grandes, pulsantes, com cores vibrantes e texto persuasivo
- Imagens: Imagens de produto em destaque com badges promocionais
- Design: Elementos que criam urgência, countdown timers, barras de progresso
- JavaScript: Animações chamativas para CTAs, popup de saída, contador regressivo` : ''}

${safeStyle === 'corporativo' ? `
ESTILO CORPORATIVO:
- Paleta de cores: Azul marinho (#0F172A), azul médio (#1E40AF) e cinza claro com toques de azul claro
- Tipografia: Fontes serifa para títulos e sans-serif para corpo de texto
- Layout: Layout estruturado, simétrico e organizado em grid bem definido
- Elementos visuais: Ícones flat em tom azul, gráficos e ilustrações técnicas
- Botões: Botões sólidos com cantos levemente arredondados e hover sutil
- Imagens: Imagens corporativas de pessoas em ambiente profissional
- Design: Elementos que transmitem confiabilidade, estabilidade e profissionalismo
- JavaScript: Animações discretas e profissionais, tabs e accordions para organizar conteúdo` : ''}

${safeStyle === 'startup' ? `
ESTILO STARTUP:
- Paleta de cores: Roxo vibrante (#7E22CE), rosa (#EC4899) e azul elétrico com gradientes
- Tipografia: Combinação de fontes modernas e arrojadas (ex: Gilroy, Circular)
- Layout: Layout com elementos sobrepostos, ângulos dinâmicos e assimetria
- Elementos visuais: Ilustrações vetoriais coloridas ou 3D, ícones modernos
- Botões: Botões com gradientes vibrantes, sombras coloridas e formas únicas
- Imagens: Imagens com tratamentos coloridos e elementos gráficos sobrepostos
- Design: Formas geométricas no background, padrões abstratos, curvas e ondas
- JavaScript: Animações criativas ao scrollar, micro-interações em elementos de UI` : ''}

${safeStyle === 'ecommerce' ? `
ESTILO E-COMMERCE:
- Paleta de cores: Azul (#0369A1), verde (#059669) com toques de laranja (#FB923C) para elementos de ação
- Tipografia: Tipografia clean e legível ideal para lojas online
- Layout: Grid de produtos bem organizado com cards de produto em destaque
- Elementos visuais: Badges de oferta, etiquetas de desconto, ratings com estrelas
- Botões: Botões de "adicionar ao carrinho" e "comprar" em destaque
- Imagens: Imagens de produto em alta qualidade com zoom ao passar o mouse
- Design: Elementos familiares de e-commerce como minicart, filtros, e indicadores de estoque
- JavaScript: Preview de produtos em hover, slider de produtos em destaque` : ''}

DIRETRIZES PARA O CSS:
- A estética DEVE seguir RIGOROSAMENTE o estilo "${safeStyle}" com cores, tipografia e layout adequados
- Utilize CSS moderno (flexbox, grid, custom properties, efeitos sutis)
- Implemente animações sutis e microinterações (hover, transições)
- Adicione media queries para responsividade completa (mobile, tablet, desktop)
- Crie visual profissional com sombras, gradientes e estilos contemporâneos
- Trabalhe com paleta de cores harmoniosa e tipografia refinada
- Utilize box-shadows sutis e bordas arredondadas para elementos principais
- Implemente layouts com proporções áureas e hierarquia visual clara
- Design responsivo obrigatório

DIRETRIZES PARA O JAVASCRIPT:
- Implemente contador regressivo funcional (não apenas visual)
- Adicione OBRIGATORIAMENTE controladores para o FAQ que façam os itens abrir e fechar quando clicados
- Adicione comportamentos interativos (accordion para FAQs, scrolling suave)
- Garanta carregar e funcionar sem plugins externos
- Inclua animações ativadas por scroll para elementos entrando na viewport
- Garanta que todas funções sejam executadas após DOMContentLoaded
- Adicione microinterações ao passar o mouse sobre botões e cards
- Implemente validação de formulários se incluir formulário de contato
- CADA ESTILO deve ter comportamentos de JavaScript ESPECÍFICOS e COERENTES com sua proposta visual

NÃO INCLUA:
- NENHUMA referência a arquivos externos (CSS, JS) - todo o código deve estar inline
- Placeholder de textos - produza texto real persuasivo para todos componentes
- NÃO use textos genéricos ou Lorem Ipsum - todo texto deve ser específico para "${safeProduct}" e "${safeNiche}"

LEMBRE-SE: 
- O conteúdo da landing page deve ser ESPECÍFICO para o produto "${safeProduct}" e não genérico
- A página DEVE parecer profissional e pronta para uso, como se tivesse sido criada por um designer e desenvolvedor front-end profissional.
- Todo o CSS e JavaScript DEVE estar completo e funcional para operar imediatamente.
- ACENTUE as diferenças visuais entre os estilos - cada estilo deve ser CLARAMENTE distinto dos demais.
`;

    console.log("Enviando prompt para a API...");

    // Chamar a API DeepSeek para gerar o HTML com CSS e JS
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: 'Você é um desenvolvedor web sênior especializado na criação de landing pages profissionais de alta conversão, com habilidades avançadas em HTML5, CSS3 e JavaScript moderno. Você cria designs visuais impressionantes e código funcional específico para o nicho e produto solicitados.' 
            },
            { 
              role: 'user', 
              content: promptContext 
            }
          ],
          temperature: 0.9,
          max_tokens: 8000,
          top_p: 1
        })
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error("Erro na API DeepSeek:", await response.text());
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      // Extrair o conteúdo da resposta
      const data = await response.json();
      console.log("Resposta recebida da API");
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error("Resposta da API em formato inválido");
      }

      const responseContent = data.choices[0].message.content;
      
      // Registrar o tempo da resposta inicial
      console.log(`API respondeu em ${Math.round(performance.now() - startTime)}ms`);
      
      // Processar e extrair os componentes da landing page
      const filesResult = extractSeparatedFiles(responseContent);
      
      if (!filesResult) {
        console.error("Falha na extração dos arquivos, usando fallback");
        return createFallbackLandingPage(safeNiche, safeProduct, safeStyle, safeBenefits, safeTargetAudience, safeCallToAction, safePricing, productImageUrl);
      }
      
      const { html, css, js } = filesResult;
      
      if (!html || html.length < 200) {
        console.error("HTML extraído é muito curto ou vazio, usando fallback");
        return createFallbackLandingPage(safeNiche, safeProduct, safeStyle, safeBenefits, safeTargetAudience, safeCallToAction, safePricing, productImageUrl);
      }

      console.log("Conteúdo extraído com sucesso:", {
        htmlLength: html.length,
        cssLength: css.length,
        jsLength: js.length
      });

      // Combinar os componentes em um único HTML
      let landingPageHTML;
      let resultResponse;

      // Se o usuário solicitou arquivos separados, retornar os componentes
      if (separateFiles) {
        landingPageHTML = createUnifiedHTML(html, css, js);
        
        resultResponse = NextResponse.json({
          separatedFiles: {
            html: html,
            css: css,
            js: js
          },
          code: landingPageHTML
        }, { 
          status: 200 
        });
      } else {
        // Combinar os componentes em um único HTML
        landingPageHTML = createUnifiedHTML(html, css, js);
        
        // Retornar a página HTML completa
        resultResponse = new NextResponse(landingPageHTML, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }

      // Salvar a landing page como criação do usuário
      try {
        const session = await getServerSession(authOptions);
        
        if (session?.user?.id) {
          // Criar um título para a landing page
          const title = `Landing Page - ${safeProduct} (${safeNiche})`;
          
          // Garantir que o conteúdo esteja no formato esperado para LandingPageContent
          const landingPageContent = {
            title: safeProduct,
            description: safeNiche,
            style: safeStyle,
            targetAudience: safeTargetAudience,
            // Incluir seções básicas para garantir compatibilidade com o modelo
            sections: [
              {
                type: 'hero',
                title: safeProduct,
                content: `Landing page para ${safeProduct} focada em ${safeNiche}`
              }
            ],
            result: landingPageHTML,
            // Armazenar os arquivos separados para possível download posterior
            htmlFile: html,
            cssFile: css,
            jsFile: js
          };
          
          // Salvar a criação no banco de dados
          await saveUserCreation(
            session.user.id,
            title,
            'landing-page',
            landingPageContent
          );
          
          console.log("Landing page salva com sucesso como criação do usuário");
        } else {
          console.log("Usuário não autenticado, landing page não será salva como criação");
        }
      } catch (error) {
        console.error("Erro ao salvar landing page como criação do usuário:", error);
        // Não bloquear a resposta em caso de erro ao salvar
      }
      
      return resultResponse;
    } catch (error) {
      console.error("Erro ao chamar a API DeepSeek:", error);
      return createFallbackLandingPage(safeNiche, safeProduct, safeStyle, safeBenefits, safeTargetAudience, safeCallToAction, safePricing, productImageUrl);
    }
  } catch (error) {
    console.error("Erro no processamento:", error);
    return new NextResponse(`Erro ao gerar a landing page: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500
    });
  }
}

// Função para criar uma landing page de fallback em caso de erro
function createFallbackLandingPage(niche: string, product: string, style: string, benefits: string[], targetAudience: string, callToAction: string, pricing: string, productImageUrl: string | null = null) {
  console.log("Criando landing page de fallback");
  
  const productImageHtml = productImageUrl 
    ? `<img src="${productImageUrl}" alt="${product}" class="hero-image" />`
    : `<div class="hero-image" style="background-image: url('https://via.placeholder.com/600x400');">
        <div class="product-badge">NOVO</div>
      </div>`;
  
  const fallbackHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product} - ${niche}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
      ${getDefaultCSS(style)}
      
      /* Melhorias para FAQ */
      .faq-question {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        text-align: left;
        padding: 1rem;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      
      .faq-question:hover {
        background-color: #e9ecef;
      }
      
      .faq-question i {
        transition: transform 0.3s ease;
      }
      
      .faq-question.active i {
        transform: rotate(180deg);
      }
      
      .faq-answer {
        padding: 1rem;
        border: 1px solid #e9ecef;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        margin-top: -0.5rem;
        margin-bottom: 1rem;
        display: none;
        background-color: #fff;
      }
      
      .faq-answer.visible {
        display: block;
      }
      
      /* Botões de download */
      .download-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #fff;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        gap: 5px;
        z-index: 9999;
      }
      
      .download-btn {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
      }
      
      .download-btn.html {
        background: #007bff;
      }
      
      .download-btn.css {
        background: #28a745;
      }
      
      .download-btn.js {
        background: #ffc107;
        color: #000;
      }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <a href="#" class="logo">${product}<span>.</span></a>
            <nav class="nav">
                <ul>
                    <li><a href="#beneficios">Benefícios</a></li>
                    <li><a href="#como-funciona">Como Funciona</a></li>
                    <li><a href="#depoimentos">Depoimentos</a></li>
                    <li><a href="#faq">FAQ</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>${product}</h1>
                <p class="subheadline">A solução ideal para ${targetAudience}</p>
                <div class="hero-badge">
                    ${benefits.map((benefit: string) => `
                    <div class="badge-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${benefit}</span>
                    </div>
                    `).join('')}
                </div>
                <div class="countdown">
                    <p>Oferta por tempo limitado!</p>
                    <div id="timer">
                        <span id="hours">23</span>:<span id="minutes">59</span>:<span id="seconds">59</span>
                    </div>
                </div>
                <a href="#oferta" class="btn btn-primary btn-large">${callToAction}</a>
                <div class="secure-checkout">
                    <i class="fas fa-lock"></i>
                    <span>Compra 100% segura</span>
                </div>
            </div>
            ${productImageHtml}
        </div>
    </section>

    <section id="beneficios" class="features">
        <div class="container">
            <h2>Principais <span>Benefícios</span></h2>
            <div class="features-grid">
                ${benefits.map((benefit: string, index: number) => `
                <div class="feature-card animate-on-scroll">
                    <div class="feature-icon">
                        <i class="fas fa-${['star', 'check-circle', 'thumbs-up', 'bolt', 'award'][index % 5]}"></i>
                    </div>
                    <h3>${benefit}</h3>
                    <p>Aproveite todos os benefícios que o ${product} oferece para transformar sua experiência no nicho de ${niche}.</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="faq" class="faq">
        <div class="container">
            <h2>Perguntas <span>Frequentes</span></h2>
            <div class="accordion">
                <div class="accordion-item">
                    <button class="faq-question">
                        O que é o ${product}?
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>${product} é uma solução inovadora para ${targetAudience} que desejam resultados eficientes no nicho de ${niche}.</p>
                    </div>
                </div>
                <div class="accordion-item">
                    <button class="faq-question">
                        Como funciona o ${product}?
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>O ${product} funciona através de um processo simples e eficaz, desenvolvido especificamente para atender às necessidades de ${targetAudience}.</p>
                    </div>
                </div>
                <div class="accordion-item">
                    <button class="faq-question">
                        Qual o valor do investimento?
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>O investimento para adquirir o ${product} é de ${pricing}, um valor extremamente acessível considerando todos os benefícios oferecidos.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section">
        <div class="container">
            <h2>Garanta seu ${product} agora</h2>
            <p>Por apenas ${pricing} você tem acesso a todos esses benefícios</p>
            <a href="#" class="btn btn-primary btn-large">${callToAction}</a>
        </div>
    </section>

    <script>
      ${getDefaultJS()}
      
      // Melhorias para FAQ e correção de imagens
      document.addEventListener('DOMContentLoaded', function() {
        // Gerenciar botões de FAQ
        const faqButtons = document.querySelectorAll('.faq-question');
        
        faqButtons.forEach(button => {
          button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('FAQ button clicked');
            
            // Toggle classe active no botão
            this.classList.toggle('active');
            
            // Encontrar o elemento de resposta correspondente
            const answer = this.nextElementSibling;
            if (answer && answer.classList.contains('faq-answer')) {
              answer.classList.toggle('visible');
            }
          });
        });
        
        // Corrigir caminhos de imagens relativas para absolutas
        const images = document.querySelectorAll('img');
        const currentOrigin = window.location.origin;
        
        images.forEach(img => {
          if (img.src && img.src.startsWith('/uploads/')) {
            img.src = currentOrigin + img.src;
          }
        });
        
        // Adicionar botões de download
        const downloadContainer = document.createElement('div');
        downloadContainer.className = 'download-container';
        
        const downloadHtmlBtn = document.createElement('button');
        downloadHtmlBtn.textContent = 'Baixar HTML';
        downloadHtmlBtn.className = 'download-btn html';
        downloadHtmlBtn.onclick = function() {
          downloadFile('html');
        };
        
        const downloadCssBtn = document.createElement('button');
        downloadCssBtn.textContent = 'Baixar CSS';
        downloadCssBtn.className = 'download-btn css';
        downloadCssBtn.onclick = function() {
          downloadFile('css');
        };
        
        const downloadJsBtn = document.createElement('button');
        downloadJsBtn.textContent = 'Baixar JS';
        downloadJsBtn.className = 'download-btn js';
        downloadJsBtn.onclick = function() {
          downloadFile('js');
        };
        
        downloadContainer.appendChild(downloadHtmlBtn);
        downloadContainer.appendChild(downloadCssBtn);
        downloadContainer.appendChild(downloadJsBtn);
        
        document.body.appendChild(downloadContainer);
        
        function downloadFile(type) {
          let content;
          let filename;
          
          if (type === 'html') {
            let htmlClone = document.documentElement.cloneNode(true);
            let head = htmlClone.querySelector('head');
            let body = htmlClone.querySelector('body');
            
            // Remover scripts inline
            Array.from(body.querySelectorAll('script')).forEach(script => {
              script.parentNode.removeChild(script);
            });
            
            // Adicionar links para CSS e JS
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = 'styles.css';
            
            const scriptTag = document.createElement('script');
            scriptTag.src = 'script.js';
            
            // Limpar head existente, mantendo meta tags
            Array.from(head.children).forEach(child => {
              if (child.tagName !== 'META' && child.tagName !== 'TITLE') {
                child.remove();
              }
            });
            
            head.appendChild(styleLink);
            body.appendChild(scriptTag);
            
            content = '<!DOCTYPE html>\\n' + htmlClone.outerHTML;
            filename = 'index.html';
          } 
          else if (type === 'css') {
            const styleElements = document.querySelectorAll('style');
            content = '';
            
            styleElements.forEach(style => {
              content += style.textContent + '\\n\\n';
            });
            
            filename = 'styles.css';
          } 
          else if (type === 'js') {
            const scriptElements = document.querySelectorAll('script:not([src])');
            content = '';
            
            scriptElements.forEach(script => {
              content += script.textContent + '\\n\\n';
            });
            
            filename = 'script.js';
          }
          
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }
      });
    </script>
</body>
</html>`;

  // Registrar a landing page como criação do usuário
  (async () => {
    try {
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
        const title = `Landing Page - ${product} (${niche})`;
        
        // Separar os arquivos para possível download posterior
        const htmlContent = fallbackHTML.replace(/<style>([\s\S]*?)<\/style>/, '')
                                       .replace(/<script>([\s\S]*?)<\/script>/, '')
                                       .replace(/\n\s*\n/g, '\n');
                                       
        const cssMatch = fallbackHTML.match(/<style>([\s\S]*?)<\/style>/);
        const cssContent = cssMatch ? cssMatch[1] : '';
        
        const jsMatch = fallbackHTML.match(/<script>([\s\S]*?)<\/script>/);
        const jsContent = jsMatch ? jsMatch[1] : '';
        
        // Garantir que o conteúdo esteja no formato esperado para LandingPageContent
        const landingPageContent = {
          title: product,
          description: niche,
          style: style,
          targetAudience: targetAudience,
          sections: [
            {
              type: 'hero',
              title: product,
              content: `Landing page para ${product} focada em ${niche}`
            }
          ],
          result: fallbackHTML,
          // Armazenar os arquivos separados para possível download posterior
          htmlFile: htmlContent,
          cssFile: cssContent,
          jsFile: jsContent
        };
        
        // Salvar a criação no banco de dados
        await saveUserCreation(
          session.user.id,
          title,
          'landing-page',
          landingPageContent
        );
        
        console.log("Landing page de fallback salva nas atividades recentes");
      }
    } catch (error) {
      console.error("Erro ao salvar landing page de fallback:", error);
    }
  })();

  // Retornar a página HTML de fallback
  return new NextResponse(fallbackHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
} 