import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CartSheet } from "@/components/CartSheet";
import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/services/api";
import { useCartStore } from "@/store/useCartStore";
import { Produto } from "@/types";

function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const { itens, carregando, erro, addItemToCart, carregarCarrinhoSalvo } =
    useCartStore();

  useEffect(() => {
    api
      .get<Produto[]>("/api/produtos")
      .then((response) => setProdutos(response.data))
      .catch(() => setErroProdutos("Não foi possível carregar os produtos."))
      .finally(() => setCarregandoProdutos(false));

    carregarCarrinhoSalvo();
  }, [carregarCarrinhoSalvo]);

  useEffect(() => {
    if (erro) toast.error(erro);
  }, [erro]);

  const quantidadeItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <div className="min-h-screen">
      <Header
        quantidadeItens={quantidadeItens}
        onAbrirCarrinho={() => setCarrinhoAberto(true)}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-lg">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Catálogo</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Equipamentos para o seu setup
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Selecionamos {produtos.length || "alguns"} itens de tecnologia. Adicione ao
            carrinho e finalize quando quiser.
          </p>
        </div>

        <ProductGrid
          produtos={produtos}
          carregando={carregandoProdutos}
          erro={erroProdutos}
          desabilitarAcoes={carregando}
          onAdicionar={(produtoId) => addItemToCart(produtoId, 1)}
        />
      </main>

      <CartSheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto} />
      <Toaster />
    </div>
  );
}

export default App;
