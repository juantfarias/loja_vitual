import { create } from "zustand";
import { ItemCarrinho } from "../types";

interface CartState {
  itens: ItemCarrinho[];
  subtotal: number;
  desconto: number;
  total: number;
  cupomId?: string;
  setItens: (itens: ItemCarrinho[]) => void;
  limparCarrinho: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itens: [],
  subtotal: 0,
  desconto: 0,
  total: 0,
  cupomId: undefined,
  setItens: (itens) => set({ itens }),
  limparCarrinho: () =>
    set({ itens: [], subtotal: 0, desconto: 0, total: 0, cupomId: undefined }),
}));
