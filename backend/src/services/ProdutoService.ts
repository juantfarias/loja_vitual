import { Produto } from "@prisma/client";
import { prisma } from "../infrastructure/prisma/client";

export const ProdutoService = {
  async listarProdutos(): Promise<Produto[]> {
    return prisma.produto.findMany({
      orderBy: { descricaoProduto: "asc" },
    });
  },
};
