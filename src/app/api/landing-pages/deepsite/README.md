# Sistema de Geração de Landing Pages do SAS-IA-Platform

Este módulo implementa a geração de landing pages de alta qualidade no SAS-IA-Platform, com funcionalidades equivalentes ao sistema DeepSite.

## Funcionalidades Principais

- **Geração de HTML Completo**: Cria landing pages responsivas com HTML5, CSS3 e JavaScript moderno.
- **Processamento de Imagens**: Substitui marcadores de imagem (`__IMG_1__`, `__IMG_2__`, etc.) por URLs reais.
- **Integração com CDNs**: Utiliza bibliotecas como Bootstrap, AOS (Animate on Scroll), FontAwesome e Google Fonts.
- **Animações e Efeitos**: Adiciona animações ao scroll e efeitos de hover para melhorar a experiência do usuário.
- **SEO Otimizado**: Inclui meta tags e microdados estruturados para melhor indexação.
- **Tracking e Analytics**: Suporte para Google Analytics, Facebook Pixel e Google Tag Manager.
- **Sistema de Diff**: Permite aplicar modificações incrementais em páginas existentes.

## Estrutura do Código

- **route.ts**: Endpoints da API para geração e recuperação de landing pages.
- **utils.ts**: Funções utilitárias para processamento de HTML, imagens, SEO e tracking.
- **diff-utils.ts**: Sistema para aplicar mudanças incrementais em landing pages existentes.

## Como Usar

### Gerando uma Nova Landing Page

```typescript
// Exemplo de requisição
const response = await fetch('/api/landing-pages/deepsite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Produto Inovador',
    description: 'Um produto revolucionário que transforma sua experiência',
    tone: 'profissional',
    callToAction: 'Compre agora com 20% de desconto',
    color: '#3498db',
    includeComponents: ['header', 'hero', 'features', 'testimonials', 'pricing', 'faq', 'contact'],
    additionalInfo: 'Produto premiado, com garantia de 30 dias',
    imageUrls: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg'
    ],
    seoConfig: {
      title: 'Produto Inovador - A Solução que Você Precisa',
      description: 'Conheça nosso produto revolucionário com tecnologia de ponta',
      keywords: 'produto, inovação, tecnologia',
      ogImage: 'https://example.com/og-image.jpg'
    },
    trackingConfig: {
      googleAnalyticsId: 'UA-XXXXXXXX-X',
      facebookPixelId: '123456789012345'
    }
  })
});

const data = await response.json();
```

### Recuperando uma Landing Page

```typescript
const response = await fetch('/api/landing-pages/deepsite?id=SESSION_ID');
const data = await response.json();
```

## Parâmetros de Configuração

### Geração de Landing Page

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `title` | string | Título principal da landing page |
| `description` | string | Descrição do produto/serviço |
| `tone` | string | Tom da comunicação (profissional, amigável, etc.) |
| `callToAction` | string | Texto para botões de ação |
| `color` | string | Cor principal (hexadecimal ou nome) |
| `includeComponents` | string[] | Componentes a incluir (header, hero, etc.) |
| `additionalInfo` | string | Informações adicionais relevantes |
| `imageUrls` | string[] | URLs das imagens a serem usadas |
| `seoConfig` | object | Configurações de SEO (title, description, etc.) |
| `trackingConfig` | object | Configurações de tracking (GA, Pixel, etc.) |

## Notas de Implementação

- O sistema utiliza a API DeepSeek para geração do HTML base.
- As imagens são processadas e substituídas nos marcadores `__IMG_N__`.
- Bibliotecas externas são carregadas via CDN para performance.
- O código gerado é sanitizado para prevenir XSS e outros problemas de segurança.
- Landing pages são armazenadas em cache para recuperação rápida.

## Próximos Passos

- Implementar sistema de templates personalizáveis.
- Adicionar suporte para outros provedores de IA além do DeepSeek.
- Melhorar o sistema de detecção e correção de problemas de acessibilidade.
- Adicionar validação automática de HTML, CSS e JS.
- Implementar sistema de versionamento para landing pages. 