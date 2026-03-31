# Asana Creator

Aplicação interna em Next.js para criar projetos a partir de um projeto-modelo do Asana.

## O que já está pronto

- tela única com duas abas;
- modo `fixed` mantendo responsáveis do modelo;
- modo `by_front` com redistribuição por seção;
- endpoint `POST /api/projects/create`;
- endpoint `GET /api/asana/users`;
- fallback em modo demonstração quando as variáveis do Asana ainda não estiverem configuradas.

## Como rodar

```bash
npm install
npm run dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `ASANA_ACCESS_TOKEN`
- `ASANA_TEMPLATE_PROJECT_GID`
- `ASANA_WORKSPACE_GID`

## Observação importante

Se as credenciais não estiverem configuradas, a aplicação continua funcionando em modo de demonstração para validar o fluxo e a interface.
