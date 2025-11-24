# Node Tree Sitter Example

Este projeto demonstra como usar a biblioteca `tree-sitter-wing.wasm` para fazer o parse de código Wing e exibir a árvore de sintaxe no console.

## Estrutura

- `src/index.ts` - Script principal que faz o parse do arquivo `main.w`
- `main.w` - Arquivo de código Wing que será analisado

## Como usar

1. Instale as dependências:
```bash
pnpm install
```

2. Execute o script:
```bash
pnpm dev
```

O script irá:
- Carregar o arquivo `main.w` da raiz do projeto
- Carregar a biblioteca `tree-sitter-wing.wasm` de `apps/tree-sitter-wing`
- Fazer o parse do código
- Exibir a árvore de sintaxe no console

## Scripts disponíveis

- `pnpm dev` - Executa o script usando tsx
- `pnpm build` - Compila o TypeScript para JavaScript
- `pnpm start` - Executa o código compilado
- `pnpm check-types` - Verifica os tipos sem compilar

