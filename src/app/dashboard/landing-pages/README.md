# Sistema de Criação de Landing Pages com IA

Este módulo permite aos usuários criar landing pages profissionais utilizando inteligência artificial, com uma experiência semelhante ao DeepSite.

## Funcionalidades

- **Criação de Landing Pages com IA**: Converse com a IA para criar landing pages personalizadas
- **Upload de Imagens**: Envie imagens para serem incluídas na landing page
- **Visualização em Tempo Real**: Veja o código sendo gerado em tempo real
- **Edição de Código**: Edite o HTML diretamente quando necessário
- **Salvamento e Gerenciamento**: Salve suas landing pages e gerencie-as facilmente
- **Visualização Responsiva**: Visualize como a landing page ficará em dispositivos desktop e mobile

## Estrutura do Módulo

### Frontend

- `/dashboard/landing-pages/page.tsx`: Lista todas as landing pages do usuário
- `/dashboard/landing-pages/deepsite/page.tsx`: Interface para criar novas landing pages com IA
- `/dashboard/landing-pages/[id]/page.tsx`: Visualização de uma landing page específica
- `/dashboard/landing-pages/edit/[id]/page.tsx`: Edição de uma landing page existente

### Backend

- `/api/landing-pages/route.ts`: API para listar e criar landing pages
- `/api/landing-pages/[id]/route.ts`: API para gerenciar uma landing page específica (obter, atualizar, excluir)
- `/api/landing-pages/deepsite/session/[sessionId]/route.ts`: API para gerenciar sessões de criação
- `/api/landing-pages/deepsite/ask-ai/route.ts`: API para comunicação com a IA
- `/api/landing-pages/deepsite/apply-diffs/route.ts`: API para aplicar diferenças de código
- `/api/landing-pages/deepsite/save/route.ts`: API para salvar landing pages
- `/api/landing-pages/deepsite/utils.ts`: Utilitários para sanitização de HTML e gerenciamento de sessões
- `/api/landing-pages/deepsite/diff-utils.ts`: Utilitários para aplicar diferenças de código

## Banco de Dados

O sistema utiliza o Prisma como ORM para interagir com o banco de dados. O modelo `LandingPage` armazena todas as informações das landing pages criadas:

```prisma
model LandingPage {
  id          String   @id @default(cuid())
  title       String
  description String?
  html        String   @db.Text
  tags        String[]
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Fluxo de Criação

1. O usuário acessa a página de criação de landing pages (`/dashboard/landing-pages/deepsite`)
2. Uma nova sessão é criada para o usuário
3. O usuário conversa com a IA, enviando instruções e imagens
4. A IA gera o código HTML incrementalmente, mostrando as alterações em tempo real
5. O usuário pode editar o código diretamente se necessário
6. Quando satisfeito, o usuário salva a landing page
7. A landing page fica disponível na lista de landing pages do usuário

## Tecnologias Utilizadas

- **Next.js**: Framework React para o frontend e API routes
- **Prisma**: ORM para interação com o banco de dados
- **OpenAI**: API de inteligência artificial para geração de landing pages
- **sanitize-html**: Biblioteca para sanitização de HTML
- **diff-match-patch**: Biblioteca para aplicar diferenças de código
- **TypeScript**: Linguagem de programação tipada
- **TailwindCSS**: Framework CSS para estilização
- **shadcn/ui**: Componentes de UI reutilizáveis

## Considerações de Segurança

- Todo o HTML gerado é sanitizado para evitar XSS e outros ataques
- As sessões são validadas para garantir que apenas o usuário autorizado possa acessá-las
- Autenticação é necessária para todas as operações
- Validações são realizadas em todas as entradas do usuário 