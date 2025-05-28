## Gerador de Landing Pages (DeepSite)

O sistema integra o gerador de landing pages do DeepSite que fornece uma experiência completa de criação e edição de landing pages. A implementação utiliza a API DeepSeek para geração de HTML e um sistema de edição em tempo real.

### Componentes principais:

1. **Endpoints da API**:
   - `/api/landing-pages/deepsite` - Gera uma nova landing page usando a API DeepSeek e retorna o HTML junto com um ID de sessão.
   - `/api/landing-pages/deepsite/ask-ai` - Permite solicitar melhorias incrementais para a landing page via streaming de respostas da API.
   - `/api/landing-pages/deepsite/apply-diffs` - Aplica alterações incrementais (diffs) no HTML da landing page.
   - `/api/landing-pages/deepsite/session/[sessionId]/update` - Atualiza a sessão com novo HTML ou título.

2. **Interface do usuário**:
   - `/dashboard/landing-pages` - Formulário para criar novas landing pages com a opção de escolher entre o motor padrão e o DeepSite.
   - `/dashboard/landing-pages/editor/[sessionId]` - Editor visual com visualização em tempo real, opções de solicitar melhorias via IA e alternar entre visualização desktop e mobile.

3. **Sistema de Créditos**:
   - Implementado em `/lib/deepsite-credits.ts` com funções específicas para o gerenciamento de créditos do DeepSite.
   - Custos definidos: 20 créditos para geração de uma nova landing page e 10 créditos para cada solicitação de melhoria.
   - Integrado com o sistema de histórico de créditos para rastreamento detalhado do uso.

4. **Armazenamento**:
   - As sessões são armazenadas temporariamente em uma variável global (`global.deepsiteSessions`).
   - Sessões expiram automaticamente após 24 horas para não acumular dados desnecessários.

5. **Tecnologias utilizadas**:
   - API DeepSeek para geração de código HTML, CSS e JavaScript.
   - Biblioteca `diff-match-patch` para aplicar alterações incrementais no HTML.
   - Streaming de respostas para feedback em tempo real durante a geração.
   - Implementação de formatação de diferenças com blocos SEARCH/REPLACE para facilitar edições precisas.

6. **Performance e Monitoramento**:
   - Métricas de performance são registradas para todas as operações usando o módulo `Performance`.
   - O consumo de créditos é monitorado e registrado para cada operação.

### Fluxo de operação:

1. O usuário preenche o formulário com informações sobre a landing page desejada.
2. O sistema verifica os créditos disponíveis e, se suficientes, envia a solicitação para a API DeepSeek.
3. O HTML gerado é armazenado em uma sessão com ID único.
4. O usuário é redirecionado para o editor onde pode visualizar e editar a página.
5. O usuário pode solicitar melhorias incrementais via prompt em linguagem natural.
6. As solicitações de melhoria são processadas como diffs para modificar apenas as partes necessárias do código.
7. Todas as alterações são aplicadas em tempo real com atualização automática da visualização.

### Detalhes de implementação:

1. **Geração inicial (`/api/landing-pages/deepsite`):**
   - Consome 20 créditos por geração
   - Usa o modelo `deepseek-coder` para criar HTML completo
   - Gera um ID de sessão único e armazena o resultado na memória

2. **Melhorias com IA (`/api/landing-pages/deepsite/ask-ai`):**
   - Consome 10 créditos por solicitação de melhoria
   - Usa streaming para mostrar as respostas em tempo real
   - Retorna modificações em formato de diff (blocos SEARCH/REPLACE)
   - Instrui a IA a modificar apenas as partes necessárias, não o HTML completo

3. **Aplicação de diffs (`/api/landing-pages/deepsite/apply-diffs`):**
   - Recebe o HTML original e o conteúdo com blocos diff
   - Usa a biblioteca `diff-match-patch` para aplicar as alterações
   - Inclui mecanismos de fallback para garantir aplicação correta
   - Lida com problemas comuns como inconsistências de quebra de linha

4. **Atualização de sessão (`/api/landing-pages/deepsite/session/[sessionId]/update`):**
   - Valida a propriedade da sessão (apenas o criador pode editar)
   - Atualiza o HTML e título armazenados
   - Registra a data de atualização

### Mecanismo de Diff:

O sistema utiliza um formato especial para aplicar modificações incrementais:
- `<<<<<<< SEARCH` - Marca o início do bloco a ser substituído
- `=======` - Separador entre o conteúdo original e a substituição
- `>>>>>>> REPLACE` - Marca o final do bloco de substituição

Este formato permite que a IA modifique apenas partes específicas do código HTML, mantendo o restante intacto.

### Manutenção:

- O sistema de armazenamento de sessões atual é temporário (em memória). Para uma solução de produção, deve ser substituído por um armazenamento persistente (MongoDB ou Redis).
- O módulo limpa automaticamente sessões com mais de 24 horas.
- A geração de landing pages consome 20 créditos por requisição inicial e 10 créditos por melhoria.
- Para instalação em produção, é necessário configurar a variável de ambiente `DEEPSEEK_API_KEY` com uma chave válida da API DeepSeek. 