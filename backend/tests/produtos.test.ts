import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Produtos e health check", () => {
  it("GET /api/health retorna status ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("GET /api/produtos retorna os 10 produtos do seed", async () => {
    const response = await request(app).get("/api/produtos");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);

    for (const produto of response.body) {
      expect(produto).toHaveProperty("id");
      expect(produto).toHaveProperty("descricaoProduto");
      expect(produto).toHaveProperty("quantidadeEstoque");
      expect(produto).toHaveProperty("precoLiquido");
    }
  });
});
