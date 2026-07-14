const IMAGENS_POR_PRODUTO: Record<string, string> = {
  "Camiseta Basica": "photo-1521572163474-6864f9cf17ab",
  "Calca Jeans": "photo-1541099649105-f69ad21f3246",
  "Tenis Esportivo": "photo-1542291026-7eec264c27ff",
  "Jaqueta Corta-Vento": "photo-1551028719-00167b16eac5",
  "Bone Aba Reta": "photo-1521369909029-2afed882baee",
  "Meia Cano Alto (Par)": "photo-1586350977771-b3b0abd50c82",
  "Mochila Notebook": "photo-1553062407-98eeb64c6a62",
  "Relogio Digital": "photo-1523275335684-37898b6baf30",
  "Oculos de Sol": "photo-1511499767150-a48a237f0083",
  "Garrafa Termica 1L": "photo-1602143407151-7111542de6e8",
};

const IMAGEM_FALLBACK = "photo-1560769629-975ec94e6a86";

export function getProdutoImagemUrl(descricaoProduto: string, largura = 600): string {
  const id = IMAGENS_POR_PRODUTO[descricaoProduto] ?? IMAGEM_FALLBACK;
  return `https://images.unsplash.com/${id}?w=${largura}&q=80&auto=format&fit=crop`;
}
