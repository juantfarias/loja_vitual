import { NextFunction, Request, Response } from "express";
import { CarrinhoService } from "../services/CarrinhoService";

export const CarrinhoController = {
  async buscarPorId(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const carrinho = await CarrinhoService.buscarPorId(cartId);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async excluir(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const carrinho = await CarrinhoService.excluir(cartId);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async criar(request: Request, response: Response, next: NextFunction) {
    try {
      const { produtoId, quantidade } = request.body;
      const carrinho = await CarrinhoService.criarComItem(produtoId, quantidade);
      response.status(201).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async adicionarItem(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const { produtoId, quantidade } = request.body;
      const carrinho = await CarrinhoService.adicionarItem(cartId, produtoId, quantidade);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async atualizarItem(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId, itemId } = request.params;
      const { quantidade } = request.body;
      const carrinho = await CarrinhoService.atualizarQuantidade(
        cartId,
        itemId,
        quantidade
      );
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async removerItem(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId, itemId } = request.params;
      const carrinho = await CarrinhoService.removerItem(cartId, itemId);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async aplicarCupom(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const { codigoCupom } = request.body;
      const carrinho = await CarrinhoService.aplicarCupom(cartId, codigoCupom);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async removerCupom(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const carrinho = await CarrinhoService.removerCupom(cartId);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },

  async checkout(request: Request, response: Response, next: NextFunction) {
    try {
      const { cartId } = request.params;
      const carrinho = await CarrinhoService.checkout(cartId);
      response.status(200).json(carrinho);
    } catch (error) {
      next(error);
    }
  },
};
