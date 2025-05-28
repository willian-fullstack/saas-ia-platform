# DeepSite: Gerador Avançado de Landing Pages

Este documento fornece uma visão geral técnica do gerador DeepSite para landing pages e explica como utilizá-lo efetivamente.

## Visão Geral

O DeepSite é um sistema de geração de landing pages que utiliza a API DeepSeek para criar páginas web profissionais e totalmente editáveis. Diferente do gerador padrão, o DeepSite oferece:

1. Editor visual com visualização em tempo real
2. Suporte para solicitações de melhorias por IA
3. Edição direta do código HTML
4. Visualização em modo desktop e mobile
5. Recursos avançados de UX/UI como animações AOS, Bootstrap e FontAwesome

## Arquitetura

O sistema é composto por:

1. **Frontend**:
   - Formulário de configuração em `/dashboard/landing-pages`
   - Editor visual em `/dashboard/landing-pages/editor/[sessionId]`

2. **Backend**:
   - API principal em `/api/landing-pages/deepsite`
   - API de melhorias em `/api/landing-pages/deepsite/ask-ai`
   - API de diff em `/api/landing-pages/deepsite/apply-diffs`
   - API de sessão em `/api/landing-pages/deepsite/session/[sessionId]/update`

3. **Armazenamento**:
   - Sessões são armazenadas em memória via `global.deepsiteSessions`
   - Cada sessão contém HTML, metadados e identificação do usuário

## Como usar

### Geração Inicial

1. Acesse `/dashboard/landing-pages`
2. Preencha o formulário com informações detalhadas sobre sua landing page
3. Selecione o motor "DeepSite (Recomendado)"
4. Clique em "Gerar Landing Page" (consome 20 créditos)
5. Após a geração, você será redirecionado para o editor visual

### Editor Visual

No editor, você pode:

1. **Visualizar**: Alterne entre modos desktop e mobile para ver como sua página aparece em diferentes dispositivos
2. **Editar HTML**: Modifique diretamente o código HTML na aba "Código"
3. **Solicitar melhorias**: Digite solicitações em linguagem natural como "Melhore as cores" ou "Adicione mais depoimentos"
4. **Salvar alterações**: Clique no botão "Salvar" para armazenar suas modificações

### Solicitando Melhorias via IA

O sistema oferece sugestões pré-configuradas e também aceita instruções personalizadas:

1. **Sugestões rápidas**:
   - Melhorar Hero Section
   - Adicionar Depoimentos
   - Melhorar Cores
   - Adicionar Animações
   - Adicionar FAQ

2. **Instruções personalizadas**:
   - Seja específico: "Mude a cor do cabeçalho para azul e adicione um gradiente"
   - Forneça detalhes: "Adicione um formulário de contato com campos para nome, email e mensagem"
   - Solicite melhorias de UX: "Adicione animações ao rolar a página"

## Aspectos Técnicos

### Mecanismo de Diff

O sistema utiliza um formato de diff próprio para aplicar modificações incrementais ao HTML:

```
<<<<<<< SEARCH
<h1>Título antigo</h1>
=======
<h1>Título novo</h1>
>>>>>>> REPLACE
```

Este formato permite:
1. Identificar o código original a ser substituído
2. Especificar o novo código que deve substituí-lo
3. Manter o contexto suficiente para localizar a posição correta

### Fluxo de Streaming

A API de melhorias utiliza streaming para fornecer respostas em tempo real:

1. A solicitação é enviada para a API DeepSeek
2. A resposta é transmitida em chunks para o cliente à medida que é gerada
3. O cliente coleta esses chunks e constrói a resposta completa
4. Os diffs são aplicados ao HTML original

### Considerações de Desempenho

- A geração inicial consome 20 créditos
- Cada solicitação de melhoria consome 10 créditos
- O HTML gerado é otimizado para visualização e pode incluir Bootstrap, FontAwesome e AOS
- As sessões são armazenadas em memória e expiram após 24 horas

## Dicas para Resultados Ótimos

1. **Seja detalhado no formulário inicial**: Quanto mais informações você fornecer, melhor será o resultado
2. **Verifique a visualização mobile**: Sempre teste como sua página aparece em dispositivos móveis
3. **Use solicitações específicas**: "Adicione um banner com gradiente azul" é melhor que "Melhore o design"
4. **Faça mudanças incrementais**: Solicite uma modificação por vez para melhores resultados
5. **Edite o HTML manualmente**: Para ajustes precisos, você sempre pode editar diretamente o código

## Limitações Atuais

1. Armazenamento em memória (não persistente entre reinicializações do servidor)
2. Imagens são referenciadas por URL (não são carregadas para um CDN)
3. O limite de tokens pode afetar landing pages muito complexas
4. Sem suporte para bibliotecas JavaScript específicas além das incluídas automaticamente

## Próximos Passos

Estamos trabalhando para melhorar o DeepSite com:

1. Armazenamento persistente de sessões
2. Upload de imagens para CDN
3. Mais bibliotecas e componentes pré-configurados
4. Exportação para projetos Next.js e React
5. Modelos prontos para personalização

## Suporte

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento. 