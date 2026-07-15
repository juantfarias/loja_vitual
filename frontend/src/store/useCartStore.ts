import axios from "axios";
import { create } from "zustand";
import { api } from "../services/api";
import { CarrinhoResponse, CupomAplicado, ItemCarrinhoDetalhado } from "../types";

const CART_ID_STORAGE_KEY = "cartId";

interface CartState {
  cartId: string | null;
  status: "ABERTO" | "FINALIZADO" | null;
  itens: ItemCarrinhoDetalhado[];
  subtotal: number;
  desconto: number;
  total: number;
  cupom: CupomAplicado | null;
  carregando: boolean;
  erro: string | null;

  carregarCarrinhoSalvo: () => Promise<void>;
  addItemToCart: (produtoId: number, quantidade: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantidade: number) => Promise<void>;
  removeItemFromCart: (itemId: string) => Promise<void>;
  applyCoupon: (codigoCupom: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  checkout: () => Promise<void>;
  limparCarrinho: () => Promise<void>;
}

const estadoInicial = {
  cartId: null,
  status: null,
  itens: [] as ItemCarrinhoDetalhado[],
  subtotal: 0,
  desconto: 0,
  total: 0,
  cupom: null as CupomAplicado | null,
  carregando: false,
  erro: null as string | null,
};

function extrairMensagemDeErro(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const mensagem = error.response?.data?.message;
    if (typeof mensagem === "string") return mensagem;
    if (error.response?.status) {
      return `Erro ${error.response.status} ao processar a requisição.`;
    }
  }
  return "Erro inesperado. Tente novamente.";
}

export const useCartStore = create<CartState>((set, get) => {
  function aplicarResposta(data: CarrinhoResponse) {
    localStorage.setItem(CART_ID_STORAGE_KEY, data.id);
    set({
      cartId: data.id,
      status: data.status,
      itens: data.itens,
      subtotal: data.subtotal,
      desconto: data.desconto,
      total: data.total,
      cupom: data.cupom,
      carregando: false,
      erro: null,
    });
  }

  return {
    ...estadoInicial,

    carregarCarrinhoSalvo: async () => {
      const cartIdSalvo = localStorage.getItem(CART_ID_STORAGE_KEY);
      if (!cartIdSalvo) return;

      try {
        const { data } = await api.get<CarrinhoResponse>(
          `/api/carrinhos/${cartIdSalvo}`
        );
        aplicarResposta(data);
      } catch {
        // carrinho não existe mais (excluído, ou de outro ambiente) — limpa silenciosamente
        localStorage.removeItem(CART_ID_STORAGE_KEY);
      }
    },

    addItemToCart: async (produtoId, quantidade) => {
      set({ carregando: true, erro: null });
      try {
        const { cartId } = get();
        const { data } = cartId
          ? await api.post<CarrinhoResponse>(`/api/carrinhos/${cartId}/itens`, {
              produtoId,
              quantidade,
            })
          : await api.post<CarrinhoResponse>("/api/carrinhos", {
              produtoId,
              quantidade,
            });
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    updateItemQuantity: async (itemId, quantidade) => {
      const { cartId } = get();
      if (!cartId) {
        set({ erro: "Nenhum carrinho ativo." });
        return;
      }
      set({ carregando: true, erro: null });
      try {
        const { data } = await api.put<CarrinhoResponse>(
          `/api/carrinhos/${cartId}/itens/${itemId}`,
          { quantidade }
        );
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    removeItemFromCart: async (itemId) => {
      const { cartId } = get();
      if (!cartId) {
        set({ erro: "Nenhum carrinho ativo." });
        return;
      }
      set({ carregando: true, erro: null });
      try {
        const { data } = await api.delete<CarrinhoResponse>(
          `/api/carrinhos/${cartId}/itens/${itemId}`
        );
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    applyCoupon: async (codigoCupom) => {
      const { cartId } = get();
      if (!cartId) {
        set({ erro: "Nenhum carrinho ativo." });
        return;
      }
      set({ carregando: true, erro: null });
      try {
        const { data } = await api.post<CarrinhoResponse>(
          `/api/carrinhos/${cartId}/cupom`,
          { codigoCupom }
        );
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    removeCoupon: async () => {
      const { cartId } = get();
      if (!cartId) {
        set({ erro: "Nenhum carrinho ativo." });
        return;
      }
      set({ carregando: true, erro: null });
      try {
        const { data } = await api.delete<CarrinhoResponse>(
          `/api/carrinhos/${cartId}/cupom`
        );
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    checkout: async () => {
      const { cartId } = get();
      if (!cartId) {
        set({ erro: "Nenhum carrinho ativo." });
        return;
      }
      set({ carregando: true, erro: null });
      try {
        const { data } = await api.post<CarrinhoResponse>(
          `/api/carrinhos/${cartId}/checkout`
        );
        aplicarResposta(data);
      } catch (error) {
        set({ erro: extrairMensagemDeErro(error), carregando: false });
      }
    },

    limparCarrinho: async () => {
      const { cartId, status } = get();

      if (cartId && status === "ABERTO") {
        try {
          await api.delete(`/api/carrinhos/${cartId}`);
        } catch (error) {
          // carrinho já pode ter sido removido por outra aba/sessão — segue o reset local mesmo assim
          console.error("Erro ao excluir carrinho:", error);
        }
      }

      localStorage.removeItem(CART_ID_STORAGE_KEY);
      set({ ...estadoInicial });
    },
  };
});
