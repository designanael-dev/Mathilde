# Mathilde

Companhia digital criada para oferecer presença e escuta em momentos de solidão, tristeza ou cansaço emocional.

## Estrutura

- `src/` — interface React
- `server/` — backend que protege a chave da Anthropic
- `index.html` — entrada do app
- `vite.config.js` — configuração do Vite

## Rodar localmente

1. Instale Node.js.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Coloque sua chave da Anthropic em `ANTHROPIC_API_KEY`.
5. Execute `npm run dev`.

## Produção

Execute:

`npm run build`

e depois:

`npm start`

A chave da Anthropic deve ficar somente no servidor, nunca dentro do código React.
