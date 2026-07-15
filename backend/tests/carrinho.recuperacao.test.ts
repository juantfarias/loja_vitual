import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

interface ProdutoResumo {
  id: number;
  descricaoProduto: string;
}

describe("Recuperação e exclusão de carrinho (GET/DELETE /api/carrinhos/:cartId)", () => {
  let produtoId: number;

  beforeAll(async () => {
    const response = await request(app).get("/api/produtos");
    const produtos: ProdutoResumo[] = response.body;
    produtoId = produtos[0].id;
  });

  it("GET de cartId inexistente retorna 404", async () => {
    const response = await request(app).get(
      "/api/carrinhos/00000000-0000-0000-0000-000000000000"
    );

    expect(response.status).toBe(404);
  });

  it("GET de cartId malformado retorna 404", async () => {
    const response = await request(app).get("/api/carrinhos/nao-eh-um-uuid");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("cartId inválido.");
  });

  it("cria um carrinho, recupera via GET e confirma que os dados batem", async () => {
    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId, quantidade: 1 });

    const cartId = criado.body.id;

    const recuperado = await request(app).get(`/api/carrinhos/${cartId}`);

    expect(recuperado.status).toBe(200);
    expect(recuperado.body).toEqual(criado.body);
  });

  it("exclui um carrinho ABERTO, e um GET seguinte confirma 404", async () => {
    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId, quantidade: 1 });

    const cartId = criado.body.id;

    const excluido = await request(app).delete(`/api/carrinhos/${cartId}`);
    expect(excluido.status).toBe(200);
    expect(excluido.body.id).toBe(cartId);

    const depois = await request(app).get(`/api/carrinhos/${cartId}`);
    expect(depois.status).toBe(404);
  });

  it("não permite excluir um carrinho FINALIZADO (409), e ele continua existindo", async () => {
    const criado = await request(app)
      .post("/api/carrinhos")
      .send({ produtoId, quantidade: 1 });

    const cartId = criado.body.id;

    await request(app).post(`/api/carrinhos/${cartId}/checkout`);

    const tentativaExclusao = await request(app).delete(`/api/carrinhos/${cartId}`);
    expect(tentativaExclusao.status).toBe(409);
    expect(tentativaExclusao.body.message).toBe(
      "Não é possível excluir um carrinho finalizado."
    );

    const aindaExiste = await request(app).get(`/api/carrinhos/${cartId}`);
    expect(aindaExiste.status).toBe(200);
    expect(aindaExiste.body.status).toBe("FINALIZADO");
  });

  it("excluir um cartId inexistente retorna 404", async () => {
    const response = await request(app).delete(
      "/api/carrinhos/00000000-0000-0000-0000-000000000000"
    );

    expect(response.status).toBe(404);
  });
});
