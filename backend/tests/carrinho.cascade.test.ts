import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/infrastructure/prisma/client";

interface ProdutoResumo {
  id: number;
  descricaoProduto: string;
  quantidadeEstoque: number;
  precoLiquido: string;
}

const CART_ID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

describe("Fluxo completo do carrinho (cascata)", () => {
  let notebookId: number;
  let notebookEstoque: number;
  let notebookPreco: number;
  let mouseId: number;
  let mouseEstoque: number;
  let mousePreco: number;

  let cartId: string;
  let itemNotebookId: string;
  let itemMouseId: string;

  beforeAll(async () => {
    const response = await request(app).get("/api/produtos");
    const produtos: ProdutoResumo[] = response.body;

    const notebook = produtos.find(
      (p) => p.descricaoProduto === "Notebook Dell Inspiron 15"
    )!;
    const mouse = produtos.find(
      (p) => p.descricaoProduto === "Mouse sem fio Logitech M170"
    )!;

    notebookId = notebook.id;
    notebookEstoque = notebook.quantidadeEstoque;
    notebookPreco = Number(notebook.precoLiquido);

    mouseId = mouse.id;
    mouseEstoque = mouse.quantidadeEstoque;
    mousePreco = Number(mouse.precoLiquido);
  });

  it("1. cria o carrinho com o primeiro item (Notebook)", async () => {
    const response = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId: notebookId, quantidade: 1 });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("ABERTO");
    expect(response.body.itens).toHaveLength(1);
    expect(response.body.subtotal).toBeCloseTo(notebookPreco);
    expect(response.body.desconto).toBe(0);
    expect(response.body.total).toBeCloseTo(notebookPreco);

    cartId = response.body.id;
    itemNotebookId = response.body.itens[0].id;
  });

  it("2. adiciona um segundo produto (Mouse) ao carrinho existente", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/itens`)
      .send({ produtoId: mouseId, quantidade: 2 });

    expect(response.status).toBe(200);
    expect(response.body.itens).toHaveLength(2);
    expect(response.body.subtotal).toBeCloseTo(notebookPreco + mousePreco * 2);

    itemMouseId = response.body.itens.find(
      (item: { produto: { id: number } }) => item.produto.id === mouseId
    ).id;
  });

  it("3. adicionar o mesmo produto de novo SOMA a quantidade (RN02)", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/itens`)
      .send({ produtoId: mouseId, quantidade: 1 });

    expect(response.status).toBe(200);
    const itemMouse = response.body.itens.find(
      (item: { id: string }) => item.id === itemMouseId
    );
    expect(itemMouse.quantidade).toBe(3); // 2 + 1
    expect(itemMouse.precoItem).toBeCloseTo(mousePreco * 3);
  });

  it("4. adicionar quantidade acima do estoque retorna 422", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/itens`)
      .send({ produtoId: mouseId, quantidade: mouseEstoque + 100 });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe("UnprocessableEntity");
  });

  it.each([
    ["zero", 0],
    ["negativa", -1],
    ["string", "abc"],
    ["ausente", undefined],
  ])("5. adicionar quantidade inválida (%s) retorna 400", async (_label, quantidade) => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/itens`)
      .send({ produtoId: mouseId, quantidade });

    expect(response.status).toBe(400);
  });

  it("6. PUT substitui a quantidade em vez de somar", async () => {
    const response = await request(app)
      .put(`/api/carrinhos/${cartId}/itens/${itemMouseId}`)
      .send({ quantidade: 5 });

    expect(response.status).toBe(200);
    const itemMouse = response.body.itens.find(
      (item: { id: string }) => item.id === itemMouseId
    );
    expect(itemMouse.quantidade).toBe(5); // substituiu os 3, não somou
    expect(itemMouse.precoItem).toBeCloseTo(mousePreco * 5);
  });

  it("7. PUT com quantidade acima do estoque retorna 422", async () => {
    const response = await request(app)
      .put(`/api/carrinhos/${cartId}/itens/${itemMouseId}`)
      .send({ quantidade: mouseEstoque + 1 });

    expect(response.status).toBe(422);
  });

  it("8. aplica o cupom 10OFF e recalcula desconto/total", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/cupom`)
      .send({ codigoCupom: "10OFF" });

    expect(response.status).toBe(200);
    expect(response.body.cupom).toEqual({
      codigoCupom: "10OFF",
      percentualDesconto: 10,
    });

    const subtotalEsperado = notebookPreco + mousePreco * 5;
    const descontoEsperado = subtotalEsperado * 0.1;
    expect(response.body.subtotal).toBeCloseTo(subtotalEsperado);
    expect(response.body.desconto).toBeCloseTo(descontoEsperado);
    expect(response.body.total).toBeCloseTo(subtotalEsperado - descontoEsperado);
  });

  it("9. aplicar 15OFF substitui o cupom anterior (só um ativo)", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/cupom`)
      .send({ codigoCupom: "15OFF" });

    expect(response.status).toBe(200);
    expect(response.body.cupom).toEqual({
      codigoCupom: "15OFF",
      percentualDesconto: 15,
    });
  });

  it("10. aplicar cupom inexistente retorna 404 e não altera o cupom ativo", async () => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/cupom`)
      .send({ codigoCupom: "NAOEXISTE" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Cupom inválido.");

    // Não existe rota GET /api/carrinhos/:id — checa o estado direto no banco
    // pra confirmar que a tentativa inválida não mudou o cupom aplicado.
    const carrinho = await prisma.carrinho.findUnique({
      where: { id: cartId },
      include: { cupom: true },
    });
    expect(carrinho?.cupom?.codigoCupom).toBe("15OFF");
  });

  it("11. remove o cupom aplicado", async () => {
    const response = await request(app).delete(`/api/carrinhos/${cartId}/cupom`);

    expect(response.status).toBe(200);
    expect(response.body.cupom).toBeNull();
    expect(response.body.desconto).toBe(0);
    expect(response.body.total).toBeCloseTo(response.body.subtotal);
  });

  it("12. remove um item (não o último) e recalcula os totais", async () => {
    const response = await request(app).delete(
      `/api/carrinhos/${cartId}/itens/${itemMouseId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.itens).toHaveLength(1);
    expect(response.body.subtotal).toBeCloseTo(notebookPreco);
  });

  it("13. remover o último item zera subtotal/desconto/total", async () => {
    const response = await request(app).delete(
      `/api/carrinhos/${cartId}/itens/${itemNotebookId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.itens).toHaveLength(0);
    expect(response.body.subtotal).toBe(0);
    expect(response.body.desconto).toBe(0);
    expect(response.body.total).toBe(0);
  });

  it("14. UUID malformado em cartId/itemId retorna 404", async () => {
    const respCartId = await request(app)
      .post("/api/carrinhos/nao-eh-um-uuid/itens")
      .send({ produtoId: notebookId, quantidade: 1 });
    expect(respCartId.status).toBe(404);
    expect(respCartId.body.message).toBe("cartId inválido.");

    const respItemId = await request(app)
      .put(`/api/carrinhos/${cartId}/itens/nao-eh-um-uuid`)
      .send({ quantidade: 1 });
    expect(respItemId.status).toBe(404);
    expect(respItemId.body.message).toBe("itemId inválido.");
  });

  it.each([
    ["string", "abc"],
    ["negativo", -1],
    ["ausente", undefined],
  ])("15. produtoId inválido (%s) retorna 404", async (_label, produtoId) => {
    const response = await request(app)
      .post(`/api/carrinhos/${cartId}/itens`)
      .send({ produtoId, quantidade: 1 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("produtoId inválido.");
  });

  it("16. finaliza o carrinho (checkout)", async () => {
    const response = await request(app).post(`/api/carrinhos/${cartId}/checkout`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("FINALIZADO");
  });

  it.each([
    ["adicionar item", () =>
      request(app)
        .post(`/api/carrinhos/${cartId}/itens`)
        .send({ produtoId: notebookId, quantidade: 1 })],
    ["atualizar item", () =>
      request(app)
        .put(`/api/carrinhos/${cartId}/itens/${CART_ID_INEXISTENTE}`)
        .send({ quantidade: 1 })],
    ["remover item", () =>
      request(app).delete(`/api/carrinhos/${cartId}/itens/${CART_ID_INEXISTENTE}`)],
    ["aplicar cupom", () =>
      request(app)
        .post(`/api/carrinhos/${cartId}/cupom`)
        .send({ codigoCupom: "10OFF" })],
    ["remover cupom", () => request(app).delete(`/api/carrinhos/${cartId}/cupom`)],
  ])("17. mutação (%s) num carrinho finalizado retorna 409", async (_label, fazerRequisicao) => {
    const response = await fazerRequisicao();

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Carrinho já finalizado.");
  });

  it("18. finalizar de novo um carrinho já finalizado retorna 409", async () => {
    const response = await request(app).post(`/api/carrinhos/${cartId}/checkout`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Carrinho já finalizado.");
  });
});
