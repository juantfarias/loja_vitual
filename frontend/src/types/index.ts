export interface Produto {
  id: string;
  descricaoProduto: string;
  quantidadeEstoque: number;
  precoLiquido: number;
}

export interface Cupom {
  id: string;
  codigoCupom: string;
  percentualDesconto: number;
}

export interface ItemCarrinho {
  id: string;
  carrinhoId: string;
  produtoId: string;
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
