import { useEffect, useState, type FC, type ReactElement } from "react";
import { Language, Parser, Tree } from "web-tree-sitter";
import treeSitterWasmUrl from "web-tree-sitter/tree-sitter.wasm?url";
import './WingCode.css';


const wingLanguageWasmBaseUrl = new URL(
  "../../../tree-sitter-wing/tree-sitter-wing.wasm",
  import.meta.url,
).href;

// Palavras-chave do Wing
const WING_KEYWORDS = new Set([
  'bring', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 'return',
  'fn', 'class', 'interface', 'struct', 'enum', 'new', 'this', 'super',
  'async', 'await', 'in', 'is', 'as', 'extends', 'implements', 'static',
  'public', 'private', 'protected', 'internal', 'extern', 'inflight',
  'preflight', 'test', 'try', 'catch', 'throw', 'finally'
]);

const WING_SPECIAL_CHARACTERS = new Set([
  ';', ',', '.', ':', '(', ')', '{', '}', '[', ']', '"', "'",
]);

interface WingCodeProps {
  code: string;
}

// Extrai palavras-chave da árvore tree-sitter
type TreeNode = NonNullable<ReturnType<Tree['rootNode']['child']>>;

interface HighlightPosition {
  startIndex: number;
  endIndex: number;
  type: 'keyword' | 'builtin_type' | 'number' | 'special_character' | 'class_identifier';
}

const extractKeywordsFromNode = (node: TreeNode, code: string, highlights: HighlightPosition[]): void => {
  const nodeType = node.type.toLowerCase();

  console.log("%s %s", nodeType, node.text);

  // Verifica se é um nó class_definition
  if (nodeType === 'class_definition') {
    // Procura pelo identifier filho direto do class_definition
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type.toLowerCase() === 'identifier') {
        const startIndex = child.startIndex;
        const endIndex = child.endIndex;
        highlights.push({ startIndex, endIndex, type: 'class_identifier' });
        break; // Encontrou o identifier, não precisa continuar procurando
      }
    }
    // Continua processando os filhos recursivamente para outros highlights
  }

  // Verifica se é um nó builtin_type (que possui filhos)
  if (nodeType === 'builtin_type' && node.childCount > 0) {
    // Extrai o filho do builtin_type
    const child = node.child(0);
    if (child) {
      const startIndex = child.startIndex;
      const endIndex = child.endIndex;
      highlights.push({ startIndex, endIndex, type: 'builtin_type' });
    }
    // Não processa os filhos recursivamente para evitar duplicatas
    return;
  }

  // Verifica se é um nó number
  if (nodeType === 'number' || nodeType === 'number_literal') {
    const startIndex = node.startIndex;
    const endIndex = node.endIndex;
    highlights.push({ startIndex, endIndex, type: 'number' });
    // Se é um nó terminal, não precisa processar filhos
    if (node.childCount === 0) {
      return;
    }
  }

  // Verifica se é um caractere especial
  if (node.childCount === 0 && node.text) {
    const text = node.text;
    // Verifica se o texto é um caractere especial
    if (WING_SPECIAL_CHARACTERS.has(text)) {
      const startIndex = node.startIndex;
      const endIndex = node.endIndex;
      highlights.push({ startIndex, endIndex, type: 'special_character' });
      return;
    }
  }

  // Verifica se é um nó de palavra-chave
  // No tree-sitter, palavras-chave geralmente têm tipo "keyword" ou são nós terminais
  // Também verificamos se o texto do nó é uma palavra-chave conhecida
  const isKeywordNode = node.childCount === 0 && node.text && WING_KEYWORDS.has(node.text.toLowerCase());

  if (isKeywordNode) {
    const startIndex = node.startIndex;
    const endIndex = node.endIndex;
    const text = code.substring(startIndex, endIndex);

    // Verifica se o texto realmente é uma palavra-chave
    if (WING_KEYWORDS.has(text.toLowerCase())) {
      highlights.push({ startIndex, endIndex, type: 'keyword' });
    }

    // Se é um nó terminal, não precisa processar filhos
    if (node.childCount === 0) {
      return;
    }
  }

  // Recursivamente processa todos os filhos
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      extractKeywordsFromNode(child, code, highlights);
    }
  }
};

// Função para destacar palavras-chave, builtin_types, números e caracteres especiais no código usando a árvore tree-sitter
const highlightKeywords = (tree: Tree, code: string): ReactElement[] => {
  const highlights: HighlightPosition[] = [];

  // Extrai todas as posições das palavras-chave, builtin_types, números e caracteres especiais da árvore
  extractKeywordsFromNode(tree.rootNode, code, highlights);

  // Ordena por posição de início
  highlights.sort((a, b) => a.startIndex - b.startIndex);

  // Remove duplicatas (pode haver sobreposição se houver nós aninhados)
  const uniqueHighlights: HighlightPosition[] = [];
  for (const highlight of highlights) {
    const overlaps = uniqueHighlights.some(
      h => highlight.startIndex >= h.startIndex && highlight.endIndex <= h.endIndex
    );
    if (!overlaps) {
      // Remove highlights que estão dentro de outros
      const filtered = uniqueHighlights.filter(
        h => !(h.startIndex >= highlight.startIndex && h.endIndex <= highlight.endIndex)
      );
      filtered.push(highlight);
      uniqueHighlights.length = 0;
      uniqueHighlights.push(...filtered);
    }
  }

  // Reconstrói o código com highlights
  const parts: ReactElement[] = [];
  let lastIndex = 0;

  for (const highlight of uniqueHighlights) {
    // Adiciona texto antes do highlight
    if (highlight.startIndex > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{code.substring(lastIndex, highlight.startIndex)}</span>
      );
    }

    // Adiciona highlight com classe CSS baseada no tipo
    const className = highlight.type === 'keyword'
      ? 'wing-code-keyword'
      : highlight.type === 'builtin_type'
        ? 'wing-code-builtin-type'
        : highlight.type === 'number'
          ? 'wing-code-number'
          : highlight.type === 'class_identifier'
            ? 'wing-code-class-identifier'
            : 'wing-code-special-character';

    parts.push(
      <span
        key={`${highlight.type}-${highlight.startIndex}`}
        className={className}
      >
        {code.substring(highlight.startIndex, highlight.endIndex)}
      </span>
    );

    lastIndex = highlight.endIndex;
  }

  // Adiciona texto restante após o último highlight
  if (lastIndex < code.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{code.substring(lastIndex)}</span>
    );
  }

  // Se não houver highlights, retorna o código original
  return parts.length > 0 ? parts : [<span key="no-match">{code}</span>];
};

export const WingCode: FC<WingCodeProps> = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tree, setTree] = useState<Tree | null>(null);
  const [parser, setParser] = useState<Parser | null>(null);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Inicializa o parser do web-tree-sitter
        await Parser.init({
          locateFile(scriptName: string) {
            if (scriptName.endsWith("tree-sitter.wasm")) {
              return treeSitterWasmUrl;
            }
            return `/${scriptName}`;
          },
        });

        // Carrega o arquivo WASM da linguagem Wing diretamente do pacote local
        const wingLanguageUrlNoCache = `${wingLanguageWasmBaseUrl}?v=${Date.now()}`;
        const resp = await fetch(wingLanguageUrlNoCache, { cache: 'no-store' });
        if (!resp.ok) {
          throw new Error(`Falha ao baixar wing wasm: ${resp.status} ${resp.statusText}`);
        }
        const buf = await resp.arrayBuffer();
        const wingLanguage = await Language.load(new Uint8Array(buf));

        // Cria o parser
        const newParser = new Parser();
        newParser.setLanguage(wingLanguage);
        setParser(newParser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar WASM'));
      } finally {
        setLoading(false);
      }
    }

    loadLanguage();
  }, []);

  // Faz o parse do código quando o parser estiver pronto ou quando code mudar
  useEffect(() => {
    if (!parser) return;

    try {
      // Remove espaços em branco desnecessários no início e fim
      // mas preserva quebras de linha e indentação
      const trimmedCode = code.trim();

      const parsedTree = parser.parse(trimmedCode);
      setTree(parsedTree);
    } catch (err) {
      console.error('Erro ao fazer parse:', err);
      setError(err instanceof Error ? err : new Error('Erro ao fazer parse do código'));
    }
  }, [parser, code]);

  if (loading) {
    return <div className="wing-code-loading">Carregando parser...</div>;
  }

  if (error) {
    return <div className="wing-code-error">Erro: {error.message}</div>;
  }

  if (!tree) {
    return null;
  }

  return (
    <div className="wing-code-container">
      <div className="wing-code-section">
        <h3>Código:</h3>
        <pre className="wing-code-output">
          {highlightKeywords(tree, code.trim())}
        </pre>
      </div>
      <div>
        <h3>Árvore de Sintaxe:</h3>
        <pre className="wing-code-tree-output">
          {tree.rootNode.toString()}
        </pre>
      </div>
    </div>
  );
}