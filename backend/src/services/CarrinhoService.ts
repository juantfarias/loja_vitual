import { Prisma } from "@prisma/client";
import { prisma } from "../infrastructure/prisma/client";
import { AppError } from "../shared/AppError";
import { assertProdutoIdOuFalhar } from "../shared/produtoId";
import { assertUuidOrNotFound } from "../shared/uuid";

type Tx = Prisma.TransactionClient;

export interface CarrinhoResponseDTO {
  id: string;
  status: string;
  subtotal: number;
  desconto: number;
  total: number;
  cupom: { codigoCupom: string; percentualDesconto: number } | null;
  itens: {
    id: string;
    produto: {
      id: number;
      descricaoProduto: string;
      precoLiquido: number;
      quantidadeEstoque: number;
    };
    quantidade: number;
    precoItem: number;
  }[];
}

function validarQuantidade(quantidade: unknown): number {
  if (typeof quantidade !== "number" || !Number.isInteger(quantidade)) {
    throw new AppError(
      "quantidade é obrigatória e deve ser um número inteiro.",
      400,
      "BadRequest"
    );
  }
  if (quantidade <= 0) {
    throw new AppError("quantidade deve ser maior que zero.", 400, "BadRequest");
  }
  return quantidade;
}

async function buscarCarrinhoAtivoOuFalhar(cartId: string, tx: Tx) {
  const carrinho = await tx.carrinho.findUnique({ where: { id: cartId } });
  if (!carrinho) {
    throw new AppError("Carrinho não encontrado.", 404, "NotFound");
  }
  if (carrinho.status === "FINALIZADO") {
    throw new AppError("Carrinho já finalizado.", 409, "Conflict");
  }
  return carrinho;
}

async function recalcularTotais(cartId: string, tx: Tx): Promise<void> {
  const itens = await tx.itemCarrinho.findMany({ where: { carrinhoId: cartId } });

  const subtotal = itens.reduce(
    (acumulado, item) => acumulado.plus(item.precoItem),
    new Prisma.Decimal(0)
  );

  const carrinho = await tx.carrinho.findUnique({
    where: { id: cartId },
    include: { cupom: true },
  });

  const percentual = carrinho?.cupom
    ? carrinho.cupom.percentualDesconto
    : new Prisma.Decimal(0);

  const desconto = subtotal.times(percentual).dividedBy(100);
  const total = subtotal.minus(desconto);

  await tx.carrinho.update({
    where: { id: cartId },
    data: { subtotal, desconto, total },
  });
}

async function montarResposta(cartId: string, tx: Tx): Promise<CarrinhoResponseDTO> {
  const carrinho = await tx.carrinho.findUnique({
    where: { id: cartId },
    include: {
      cupom: true,
      itens: { include: { produto: true } },
    },
  });

  if (!carrinho) {
    throw new AppError("Carrinho não encontrado.", 404, "NotFound");
  }

  return {
    id: carrinho.id,
    status: carrinho.status,
    subtotal: carrinho.subtotal.toNumber(),
    desconto: carrinho.desconto.toNumber(),
    total: carrinho.total.toNumber(),
    cupom: carrinho.cupom
      ? {
          codigoCupom: carrinho.cupom.codigoCupom,
          percentualDesconto: carrinho.cupom.percentualDesconto.toNumber(),
        }
      : null,
    itens: carrinho.itens.map((item) => ({
      id: item.id,
      produto: {
        id: item.produto.id,
        descricaoProduto: item.produto.descricaoProduto,
        precoLiquido: item.produto.precoLiquido.toNumber(),
        quantidadeEstoque: item.produto.quantidadeEstoque,
      },
      quantidade: item.quantidade,
      precoItem: item.precoItem.toNumber(),
    })),
  };
}

export const CarrinhoService = {
  async buscarPorId(cartId: string): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");

    return prisma.$transaction(async (tx) => {
      return montarResposta(cartId, tx);
    });
  },

  async excluir(cartId: string): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");

    return prisma.$transaction(async (tx) => {
      const carrinho = await tx.carrinho.findUnique({ where: { id: cartId } });
      if (!carrinho) {
        throw new AppError("Carrinho não encontrado.", 404, "NotFound");
      }
      if (carrinho.status === "FINALIZADO") {
        throw new AppError(
          "Não é possível excluir um carrinho finalizado.",
          409,
          "Conflict"
        );
      }

      const resposta = await montarResposta(cartId, tx);

      await tx.itemCarrinho.deleteMany({ where: { carrinhoId: cartId } });
      await tx.carrinho.delete({ where: { id: cartId } });

      return resposta;
    });
  },

  async criarComItem(
    produtoIdBruto: unknown,
    quantidade: unknown
  ): Promise<CarrinhoResponseDTO> {
    const qtd = validarQuantidade(quantidade);
    const produtoId = assertProdutoIdOuFalhar(produtoIdBruto);

    return prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!produto) {
        throw new AppError("produtoId não encontrado.", 404, "NotFound");
      }
      if (qtd > produto.quantidadeEstoque) {
        throw new AppError(
          "Quantidade solicitada excede o estoque disponível.",
          422,
          "UnprocessableEntity"
        );
      }

      const carrinho = await tx.carrinho.create({
        data: { status: "ABERTO", subtotal: 0, desconto: 0, total: 0 },
      });

      const precoItem = new Prisma.Decimal(produto.precoLiquido).times(qtd);
      await tx.itemCarrinho.create({
        data: { carrinhoId: carrinho.id, produtoId, quantidade: qtd, precoItem },
      });

      await recalcularTotais(carrinho.id, tx);
      return montarResposta(carrinho.id, tx);
    });
  },

  async adicionarItem(
    cartId: string,
    produtoIdBruto: unknown,
    quantidade: unknown
  ): Promise<CarrinhoResponseDTO> {
    const qtd = validarQuantidade(quantidade);
    assertUuidOrNotFound(cartId, "cartId");
    const produtoId = assertProdutoIdOuFalhar(produtoIdBruto);

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      const produto = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!produto) {
        throw new AppError("produtoId não encontrado.", 404, "NotFound");
      }

      const itemExistente = await tx.itemCarrinho.findFirst({
        where: { carrinhoId: cartId, produtoId },
      });

      const novaQuantidade = (itemExistente?.quantidade ?? 0) + qtd;
      if (novaQuantidade > produto.quantidadeEstoque) {
        throw new AppError(
          "Quantidade solicitada excede o estoque disponível.",
          422,
          "UnprocessableEntity"
        );
      }

      const novoPrecoItem = new Prisma.Decimal(produto.precoLiquido).times(
        novaQuantidade
      );

      if (itemExistente) {
        await tx.itemCarrinho.update({
          where: { id: itemExistente.id },
          data: { quantidade: novaQuantidade, precoItem: novoPrecoItem },
        });
      } else {
        await tx.itemCarrinho.create({
          data: {
            carrinhoId: cartId,
            produtoId,
            quantidade: novaQuantidade,
            precoItem: novoPrecoItem,
          },
        });
      }

      await recalcularTotais(cartId, tx);
      return montarResposta(cartId, tx);
    });
  },

  async atualizarQuantidade(
    cartId: string,
    itemId: string,
    quantidade: unknown
  ): Promise<CarrinhoResponseDTO> {
    const qtd = validarQuantidade(quantidade);
    assertUuidOrNotFound(cartId, "cartId");
    assertUuidOrNotFound(itemId, "itemId");

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      const item = await tx.itemCarrinho.findFirst({
        where: { id: itemId, carrinhoId: cartId },
      });
      if (!item) {
        throw new AppError("itemId não encontrado.", 404, "NotFound");
      }

      const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
      if (!produto) {
        throw new AppError("produtoId não encontrado.", 404, "NotFound");
      }
      if (qtd > produto.quantidadeEstoque) {
        throw new AppError(
          "Quantidade solicitada excede o estoque disponível.",
          422,
          "UnprocessableEntity"
        );
      }

      await tx.itemCarrinho.update({
        where: { id: item.id },
        data: {
          quantidade: qtd,
          precoItem: new Prisma.Decimal(produto.precoLiquido).times(qtd),
        },
      });

      await recalcularTotais(cartId, tx);
      return montarResposta(cartId, tx);
    });
  },

  async removerItem(cartId: string, itemId: string): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");
    assertUuidOrNotFound(itemId, "itemId");

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      const item = await tx.itemCarrinho.findFirst({
        where: { id: itemId, carrinhoId: cartId },
      });
      if (!item) {
        throw new AppError("itemId não encontrado.", 404, "NotFound");
      }

      await tx.itemCarrinho.delete({ where: { id: item.id } });

      await recalcularTotais(cartId, tx);
      return montarResposta(cartId, tx);
    });
  },

  async aplicarCupom(
    cartId: string,
    codigoCupom: unknown
  ): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");
    if (typeof codigoCupom !== "string" || codigoCupom.trim().length === 0) {
      throw new AppError("codigoCupom é obrigatório.", 400, "BadRequest");
    }

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      const cupom = await tx.cupom.findUnique({
        where: { codigoCupom: codigoCupom.trim() },
      });
      if (!cupom) {
        throw new AppError("Cupom inválido.", 404, "NotFound");
      }

      await tx.carrinho.update({ where: { id: cartId }, data: { cupomId: cupom.id } });

      await recalcularTotais(cartId, tx);
      return montarResposta(cartId, tx);
    });
  },

  async removerCupom(cartId: string): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      await tx.carrinho.update({ where: { id: cartId }, data: { cupomId: null } });

      await recalcularTotais(cartId, tx);
      return montarResposta(cartId, tx);
    });
  },

  async checkout(cartId: string): Promise<CarrinhoResponseDTO> {
    assertUuidOrNotFound(cartId, "cartId");

    return prisma.$transaction(async (tx) => {
      await buscarCarrinhoAtivoOuFalhar(cartId, tx);

      await tx.carrinho.update({
        where: { id: cartId },
        data: { status: "FINALIZADO" },
      });

      return montarResposta(cartId, tx);
    });
  },
};
