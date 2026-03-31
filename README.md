# Asana Creator

Aplicação web em Next.js para criação de projetos no Asana a partir de um projeto-modelo, com interface visual guiada e fluxo pronto para uso interno ou produção via Vercel.

## Visão geral

O Asana Creator resolve o processo de abertura de novos projetos a partir de um template existente no Asana.

A ferramenta permite:

- criar um novo projeto com o nome do cliente;
- definir o proprietário do projeto antes da criação;
- escolher entre responsáveis padrão do modelo ou responsáveis por seção;
- resetar o projeto duplicado para uso real;
- limpar tarefas concluídas;
- limpar datas antigas;
- renomear a tarefa de implementação com o nome do novo cliente;
- redistribuir responsáveis por seção quando o modo por seção for usado.

## Como usar

Na tela principal, o usuário informa:

- `Nome do projeto`
- `Proprietário do projeto`
- opcionalmente os responsáveis por cada seção, quando estiver na aba `Responsáveis por seção`

Existem 2 modos de criação:

### 1. Responsáveis padrão

Usa os responsáveis já definidos no projeto-modelo do Asana.

Esse modo é ideal quando:

- o template já está corretamente configurado;
- a equipe quer abrir projetos com o mesmo padrão operacional;
- apenas o proprietário do projeto precisa ser escolhido.

### 2. Responsáveis por seção

Permite escolher manualmente os responsáveis de cada frente do projeto.

Esse modo é ideal quando:

- o projeto precisa ser distribuído entre pessoas diferentes;
- cada seção deve ir para um especialista específico;
- o proprietário do projeto também precisa ser definido separadamente.

## O que acontece quando o projeto é criado

Depois da duplicação do template, a aplicação executa uma sanitização do projeto para deixá-lo pronto para operação real.

Esse fluxo inclui:

- atualização do proprietário do projeto;
- espera pela disponibilidade completa das tarefas duplicadas;
- reset de tarefas e subtarefas concluídas;
- remoção de datas antigas;
- ajuste do nome da tarefa `Implementação - ...` para o novo cliente;
- redistribuição de responsáveis por seção, quando aplicável.

## Preview de animação

Existe uma rota local para validar a animação do botão sem chamar o backend:

- `/preview-button`

Ela serve apenas para testes visuais da interface.

## Tecnologias

- Next.js
- React
- TypeScript
- API Routes do App Router
- Integração com API do Asana

## Estrutura principal

- `src/app/page.tsx`: entrada da aplicação
- `src/components/project-creator-screen-v3.tsx`: tela principal em uso
- `src/components/animated-project-button.tsx`: botão animado de criação
- `src/app/api/projects/create/route.ts`: endpoint de criação do projeto
- `src/app/api/asana/users/route.ts`: endpoint para carregar usuários do Asana
- `src/lib/asana-client.ts`: integração principal com o Asana

## Rodando localmente

```bash
npm install
npm run dev
```

Aplicação disponível em:

- `http://localhost:3000`

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `ASANA_ACCESS_TOKEN`
- `ASANA_TEMPLATE_PROJECT_GID`
- `ASANA_WORKSPACE_GID`

## Produção

Para colocar em produção, o caminho recomendado é:

1. Subir este repositório no GitHub.
2. Importar o projeto na Vercel.
3. Configurar as variáveis de ambiente da aplicação na Vercel.
4. Publicar o deploy.

### Variáveis obrigatórias na Vercel

- `ASANA_ACCESS_TOKEN`
- `ASANA_TEMPLATE_PROJECT_GID`
- `ASANA_WORKSPACE_GID`

## Observações importantes

- A aplicação não depende de `localhost` para funcionar em produção.
- O que muda entre local e produção são apenas as variáveis de ambiente e o domínio final publicado.
- Se as credenciais do Asana não estiverem configuradas, a aplicação entra em modo de demonstração.
- O arquivo `.env.example` contém apenas placeholders e pode ser versionado com segurança.

## Checklist antes de publicar

- confirmar que o template do Asana está correto;
- confirmar que os usuários retornados pelo workspace são os esperados;
- configurar as variáveis na Vercel;
- testar criação nas duas abas;
- validar se o projeto sobe resetado no Asana;
- validar se o proprietário selecionado está sendo aplicado corretamente.
