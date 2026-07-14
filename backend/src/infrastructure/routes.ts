import { NextFunction, Request, Response, Router } from "express";
import { CarrinhoController } from "../controllers/CarrinhoController";
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

routes.post("/api/carrinhos", CarrinhoController.criar);
routes.post("/api/carrinhos/:cartId/itens", CarrinhoController.adicionarItem);
routes.put("/api/carrinhos/:cartId/itens/:itemId", CarrinhoController.atualizarItem);
routes.delete("/api/carrinhos/:cartId/itens/:itemId", CarrinhoController.removerItem);
routes.post("/api/carrinhos/:cartId/cupom", CarrinhoController.aplicarCupom);
routes.delete("/api/carrinhos/:cartId/cupom", CarrinhoController.removerCupom);
routes.post("/api/carrinhos/:cartId/checkout", CarrinhoController.checkout);

export { routes };
