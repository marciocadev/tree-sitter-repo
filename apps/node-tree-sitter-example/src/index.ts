import { Parser, Language } from "web-tree-sitter";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

async function main() {
  try {
    // Inicializa o parser do web-tree-sitter
    await Parser.init();

    // Carrega o arquivo main.w
    const filePath = join(projectRoot, "main.w");
    const sourceCode = readFileSync(filePath, "utf-8");

    console.log("=== Código Fonte ===");
    console.log(sourceCode);
    console.log("\n");

    // Caminho para o arquivo WASM
    const wasmPath = join(projectRoot, "..", "tree-sitter-wing", "tree-sitter-wing.wasm");
    const wasmBuffer = readFileSync(wasmPath);

    // Carrega a linguagem Wing do WASM
    const wingLanguage = await Language.load(new Uint8Array(wasmBuffer));

    // Cria o parser
    const parser = new Parser();

    // Define a linguagem
    parser.setLanguage(wingLanguage);

    // Faz o parse do código
    const tree = parser.parse(sourceCode);

    if (!tree) {
      throw new Error("Erro ao fazer parse do código");
    }

    // Exibe a árvore
    console.log("=== Árvore de Sintaxe ===");
    console.log(tree.rootNode.toString());

    // Exibe informações detalhadas
    console.log("\n=== Informações Detalhadas ===");
    console.log(`Tem erros: ${tree.rootNode.hasError ? "Sim" : "Não"}`);
    console.log(`Número de filhos: ${tree.rootNode.childCount}`);

    // Função recursiva para exibir a árvore de forma mais legível
    function printTree(node: import("web-tree-sitter").Node, indent: string = "") {
      const nodeType = node.type;
      const nodeText = node.text.substring(0, 50).replace(/\n/g, "\\n");
      console.log(`${indent}${nodeType} (${nodeText}${node.text.length > 50 ? "..." : ""})`);

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          printTree(child, indent + "  ");
        }
      }
    }

    console.log("\n=== Árvore Estruturada ===");
    printTree(tree.rootNode);

  } catch (error) {
    console.error("Erro ao fazer parse:", error);
    if (error instanceof Error) {
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main();

