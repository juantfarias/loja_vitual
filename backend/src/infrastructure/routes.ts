import { NextFunction, Request, Response, Router } from "express";
import { ProdutoService } from "../services/ProdutoService";

const routes = Router();

routes.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({ status: "ok" });
});

routes.get(
  "/api/produtos",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const produtos = await ProdutoService.listarProdutos();
      response.status(200).json(produtos);
    } catch (error) {
      next(error);
    }
  }
);

export { routes };
