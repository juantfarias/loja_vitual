import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

interface ProdutoResumo {
  id: number;
  descricaoProduto: string;
  quantidadeEstoque: number;
}

describe("Decremento de estoque no checkout", () => {
  let cadeiraId: number;
  let cadeiraEstoque: number;

  beforeAll(async () => {
    const response = await request(app).get("/api/produtos");
    const produtos: ProdutoResumo[] = response.body;

    const cadeira = produtos.find(
      (p) => p.descricaoProduto === "Cadeira Gamer ThunderX3"
    )!;
    cadeiraId = cadeira.id;
    cadeiraEstoque = cadeira.quantidadeEstoque;
  });

  it("checkout bem-sucedido decrementa o estoque do produto", async () => {
    const quantidadeComprada = 2;

    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: cadeiraId, quantidade: quantidadeComprada });
    expect(criado.status).toBe(201);

    const checkout = await request(app).post(
      `/api/carrinhos/${criado.body.id}/checkout`
    );
    expect(checkout.status).toBe(200);
    expect(checkout.body.status).toBe("FINALIZADO");

    const produtosAtualizados: ProdutoResumo[] = (
      await request(app).get("/api/produtos")
    ).body;
    const cadeiraAtualizada = produtosAtualizados.find((p) => p.id === cadeiraId)!;

    expect(cadeiraAtualizada.quantidadeEstoque).toBe(
      cadeiraEstoque - quantidadeComprada
    );

    cadeiraEstoque = cadeiraAtualizada.quantidadeEstoque;
  });

  it("dois carrinhos disputando o mesmo saldo: o segundo checkout falha com 422 e não finaliza", async () => {
    const carrinhoA = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: cadeiraId, quantidade: cadeiraEstoque });
    expect(carrinhoA.status).toBe(201);

    const carrinhoB = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: cadeiraId, quantidade: cadeiraEstoque });
    expect(carrinhoB.status).toBe(201);

    const checkoutA = await request(app).post(
      `/api/carrinhos/${carrinhoA.body.id}/checkout`
    );
    expect(checkoutA.status).toBe(200);
    expect(checkoutA.body.status).toBe("FINALIZADO");

    const checkoutB = await request(app).post(
      `/api/carrinhos/${carrinhoB.body.id}/checkout`
    );
    expect(checkoutB.status).toBe(422);
    expect(checkoutB.body.error).toBe("UnprocessableEntity");

    const carrinhoBAtual = await request(app).get(
      `/api/carrinhos/${carrinhoB.body.id}`
    );
    expect(carrinhoBAtual.body.status).toBe("ABERTO");

    const produtosAtualizados: ProdutoResumo[] = (
      await request(app).get("/api/produtos")
    ).body;
    const cadeiraAtualizada = produtosAtualizados.find((p) => p.id === cadeiraId)!;
    expect(cadeiraAtualizada.quantidadeEstoque).toBe(0);
  });

  it("checkout de carrinho esvaziado (sem itens) não mexe em nenhum estoque", async () => {
    const outroProduto: ProdutoResumo[] = (await request(app).get("/api/produtos")).body;
    const hub = outroProduto.find((p) => p.descricaoProduto === "Hub USB 4 Portas 3.0")!;

    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: hub.id, quantidade: 1 });
    expect(criado.status).toBe(201);

    const itemId = criado.body.itens[0].id;
    const esvaziado = await request(app).delete(
      `/api/carrinhos/${criado.body.id}/itens/${itemId}`
    );
    expect(esvaziado.body.itens).toHaveLength(0);

    const checkout = await request(app).post(
      `/api/carrinhos/${criado.body.id}/checkout`
    );
    expect(checkout.status).toBe(200);
    expect(checkout.body.status).toBe("FINALIZADO");

    const produtosAtualizados: ProdutoResumo[] = (
      await request(app).get("/api/produtos")
    ).body;
    const hubAtualizado = produtosAtualizados.find((p) => p.id === hub.id)!;
    expect(hubAtualizado.quantidadeEstoque).toBe(hub.quantidadeEstoque);
  });
});
