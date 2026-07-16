import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

interface ProdutoResumo {
  id: number;
  descricaoProduto: string;
  quantidadeEstoque: number;
}

describe("Decremento de estoque no checkout", () => {
  // Não usar produtos[0] da listagem (ordenada por descricaoProduto asc — hoje é a
  // "Cadeira Gamer ThunderX3"): carrinho.recuperacao.test.ts depende desse índice
  // sempre ter estoque disponível. Também evitar Notebook/Mouse (cascade.test.ts).
  let webcamId: number;
  let webcamEstoque: number;

  beforeAll(async () => {
    const response = await request(app).get("/api/produtos");
    const produtos: ProdutoResumo[] = response.body;

    const webcam = produtos.find(
      (p) => p.descricaoProduto === "Webcam Logitech C920"
    )!;
    webcamId = webcam.id;
    webcamEstoque = webcam.quantidadeEstoque;
  });

  it("checkout bem-sucedido decrementa o estoque do produto", async () => {
    const quantidadeComprada = 2;

    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: webcamId, quantidade: quantidadeComprada });
    expect(criado.status).toBe(201);

    const checkout = await request(app).post(
      `/api/carrinhos/${criado.body.id}/checkout`
    );
    expect(checkout.status).toBe(200);
    expect(checkout.body.status).toBe("FINALIZADO");

    const produtosAtualizados: ProdutoResumo[] = (
      await request(app).get("/api/produtos")
    ).body;
    const webcamAtualizada = produtosAtualizados.find((p) => p.id === webcamId)!;

    expect(webcamAtualizada.quantidadeEstoque).toBe(
      webcamEstoque - quantidadeComprada
    );

    webcamEstoque = webcamAtualizada.quantidadeEstoque;
  });

  it("dois carrinhos disputando o mesmo saldo: o segundo checkout falha com 422 e não finaliza", async () => {
    const carrinhoA = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: webcamId, quantidade: webcamEstoque });
    expect(carrinhoA.status).toBe(201);

    const carrinhoB = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: webcamId, quantidade: webcamEstoque });
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
    const webcamAtualizada = produtosAtualizados.find((p) => p.id === webcamId)!;
    expect(webcamAtualizada.quantidadeEstoque).toBe(0);
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
