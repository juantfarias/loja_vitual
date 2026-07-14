export interface Produto {
  id: number;
  descricaoProduto: string;
  quantidadeEstoque: number;
  precoLiquido: number;
}

export interface Cupom {
  id: number;
  codigoCupom: string;
  percentualDesconto: number;
}

export interface ItemCarrinho {
  id: string;
  carrinhoId: string;
  produtoId: number;
  quantidade: number;
  precoItem: number;
}

export interface Carrinho {
  id: string;
  status: string;
  subtotal: number;
  desconto: number;
  total: number;
  cupomId?: string;
}

export interface ProdutoResumoCarrinho {
  id: number;
  descricaoProduto: string;
  precoLiquido: number;
  quantidadeEstoque: number;
}

export interface ItemCarrinhoDetalhado {
  id: string;
  produto: ProdutoResumoCarrinho;
  quantidade: number;
  precoItem: number;
}

export interface CupomAplicado {
  codigoCupom: string;
  percentualDesconto: number;
}

export interface CarrinhoResponse {
  id: string;
  status: "ABERTO" | "FINALIZADO";
  subtotal: number;
  desconto: number;
  total: number;
  cupom: CupomAplicado | null;
  itens: ItemCarrinhoDetalhado[];
}
