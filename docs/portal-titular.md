# Portal do Titular — implantação segura

**Status:** implementação inicial em branch; não habilitar em produção sem completar os itens abaixo.

## Funcionalidades
- Administrador cria convite para uma pessoa cadastrada em `/convites`; o token aleatório de 256 bits é armazenado somente como SHA-256 e expira em 7 dias.
- O titular abre `/titular?convite=...`; o link sozinho **não autentica**. O servidor exige também o e-mail verificado pelo Cloudflare Access, idêntico ao e-mail do convite.
- A API `/api/holder` retorna apenas faturas e transações atribuídas à pessoa, com pedidos de contestação, correção ou rateio.
- As solicitações ficam pendentes em `holder_requests`; decisões administrativas não alteram automaticamente o ledger financeiro.

## Pré-requisitos obrigatórios
1. Aplicar `migrations/0002_portal_titular.sql` na D1 correta, após backup verificado. **Não** executar a migração automaticamente ao fazer merge.
2. Configurar Cloudflare Access para permitir autenticação dos e-mails convidados **no mesmo application audience (AUD) atualmente validado pelo código**, sem permitir que acessem APIs administrativas. O servidor já exige e-mail administrativo separado em `getChatGPTUser`.
3. Testar isolamento entre dois titulares, convite expirado, e-mail divergente, acesso administrativo indevido e revogação.
4. Confirmar que o domínio protege tanto `/titular` quanto `/api/holder`, sem exceções públicas que contornem a autenticação.
5. Executar CI, typecheck, testes e revisão de segurança antes de publicar.

## Limitações intencionais da primeira fase
- Convites são gerados, mas **não enviados automaticamente** por e-mail. O administrador copia o link.
- Revogação está prevista na tabela, mas ainda não existe botão para revogar.
- Rateio proposto exige IDs de pessoas e valores em centavos; a interface amigável para escolher pessoas está pendente.
- Aprovação registra a decisão, mas o administrador precisa aplicar manualmente o ajuste financeiro no painel principal.
- O sistema não envia notificações automáticas.
- A sessão do titular utiliza o convite guardado em sessionStorage; não é um login persistente independente do Access.
