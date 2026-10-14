# Cartão Plus — nova versão

Aplicativo web responsivo e privado, com dados persistidos em D1 e autenticação do proprietário pelo Sites. A versão anterior continua intacta.

## Organização

- `lib/ledger.mjs`: regras financeiras puras. Valores inteiros em centavos; movimentos originais nunca são apagados para compensar parcelamentos.
- `lib/importer.mjs`: leitura de PDF Nubank, preservando cada linha repetida e exibindo a diferença contra o total oficial.
- `app/api/workspace/route.ts`: operações autenticadas, controle de revisão, identificação de requisições repetidas e histórico de alterações.
- `app/dashboard.tsx`: interface, prévia da importação, responsáveis, rateios, confirmação, filtros, exportação e fila de sincronização.
- `lib/migration.ts`: fotografia privada dos dados sincronizados da versão anterior, revisada contra o PDF de outubro. Só inicializa o banco novo vazio.
- `db/schema.ts`, `drizzle/`: esquema e migração do banco. Não há alterações de esquema durante requisições.

## Regras

1. Direcionar um crédito substitui sua atribuição. Não cria outro desconto.
2. Uma compra só pode ser processada quando sua distribuição fecha integralmente.
3. Todos os centavos de um rateio são distribuídos, inclusive descontos negativos.
4. Compra original e crédito de parcelamento permanecem visíveis no histórico, com impacto zero quando vinculados com segurança. Só a parcela cobrada soma.
5. O saldo anterior é separado e pode ser distribuído sem duplicar o valor.
6. Uma diferença de um centavo continua aparecendo; o sistema não fabrica ajuste para zerá-la.
7. O backend autoriza toda leitura e escrita pela identidade do proprietário. Cada requisição recebe um identificador para evitar reaplicação após reconexão.
8. A fila local mantém alterações enquanto a conexão falha. O aviso só muda para salvo na nuvem após confirmação do servidor.

## Validação

`node --test tests/*.test.mjs`

`pnpm exec tsc --noEmit`

`pnpm run build`

## Evolução para aplicativo

O layout adapta-se ao celular e já inclui um manifesto web. Pode ser adicionado à tela inicial pelos navegadores compatíveis. O núcleo financeiro não depende de React ou de navegador: pode ser usado por um cliente Capacitor ou React Native. Antes de publicar nas lojas, implementar o fluxo de autenticação móvel e testar deep links, reconexão e ciclo de vida em aparelhos reais. A versão atual exige uma primeira conexão para abrir a página; a fila de edições funciona localmente depois de carregada.

Não reutilizar credenciais de serviço no frontend. Preservar autorização por proprietário nos novos clientes e no backend.

## Executar a partir deste repositório

Use Node 24 e pnpm. Execute `pnpm install`, `pnpm test`, `pnpm typecheck` e `pnpm build`. O comando de build prepara o leitor de PDF automaticamente. Os arquivos grandes do PDF.js são recriados a partir da dependência com versão fixada.

A hospedagem atual usa Sites com Cloudflare Workers/D1. Para portar a outro provedor, adapte a autenticação e a persistência no backend antes de publicar; o módulo financeiro permanece independente.
