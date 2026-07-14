import { useEffect, useState } from "react";
import { api } from "./services/api";
import { useCartStore } from "./store/useCartStore";
import { Produto } from "./types";

function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [codigoCupom, setCodigoCupom] = useState("");

  const {
    cartId,
    status,
    itens,
    subtotal,
    desconto,
    total,
    cupom,
    carregando,
    erro,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    applyCoupon,
    removeCoupon,
    checkout,
    limparCarrinho,
  } = useCartStore();

  useEffect(() => {
    api
      .get<Produto[]>("/api/produtos")
      .then((response) => setProdutos(response.data))
      .catch(() => setErroProdutos("Não foi possível carregar os produtos."))
      .finally(() => setCarregandoProdutos(false));
  }, []);

  const carrinhoFinalizado = status === "FINALIZADO";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Catálogo de Produtos
          </h1>

          {carregandoProdutos && (
            <p className="text-gray-500">Carregando produtos...</p>
          )}
          {erroProdutos && <p className="text-red-600">{erroProdutos}</p>}

          {!carregandoProdutos && !erroProdutos && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {produtos.map((produto) => (
                <li
                  key={produto.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold text-gray-800">
                    {produto.descricaoProduto}
                  </p>
                  <p className="text-sm text-gray-500">
                    Estoque: {produto.quantidadeEstoque}
                  </p>
                  <p className="mt-2 font-bold text-gray-900">
                    R$ {Number(produto.precoLiquido).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    disabled={carregando || carrinhoFinalizado}
                    onClick={() => addItemToCart(produto.id, 1)}
                    className="mt-3 rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    Adicionar ao carrinho
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Carrinho (teste)</h2>
            <button
              type="button"
              onClick={limparCarrinho}
              className="text-sm text-gray-500 underline"
            >
              Novo carrinho
            </button>
          </div>

          {erro && <p className="mb-4 text-red-600">{erro}</p>}
          {!cartId && !erro && (
            <p className="text-gray-500">
              Nenhum carrinho ativo. Adicione um produto pra começar.
            </p>
          )}

          {cartId && (
            <>
              <p className="mb-3 text-sm text-gray-500">
                Status: <span className="font-semibold">{status}</span>
              </p>

              <ul className="mb-4 space-y-2">
                {itens.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded border border-gray-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.produto.descricaoProduto}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qtd: {item.quantidade} — R$ {item.precoItem.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={carregando || carrinhoFinalizado}
                        onClick={() =>
                          item.quantidade - 1 <= 0
                            ? removeItemFromCart(item.id)
                            : updateItemQuantity(item.id, item.quantidade - 1)
                        }
                        className="rounded bg-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        disabled={carregando || carrinhoFinalizado}
                        onClick={() => updateItemQuantity(item.id, item.quantidade + 1)}
                        className="rounded bg-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        disabled={carregando || carrinhoFinalizado}
                        onClick={() => removeItemFromCart(item.id)}
                        className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={codigoCupom}
                  onChange={(event) => setCodigoCupom(event.target.value)}
                  placeholder="Código do cupom (ex: 10OFF)"
                  disabled={carregando || carrinhoFinalizado}
                  className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm"
                />
                <button
                  type="button"
                  disabled={carregando || carrinhoFinalizado || !codigoCupom}
                  onClick={() => applyCoupon(codigoCupom)}
                  className="rounded bg-gray-800 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  Aplicar cupom
                </button>
                <button
                  type="button"
                  disabled={carregando || carrinhoFinalizado || !cupom}
                  onClick={removeCoupon}
                  className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Remover cupom
                </button>
              </div>

              {cupom && (
                <p className="mb-2 text-sm text-gray-600">
                  Cupom aplicado: {cupom.codigoCupom} ({cupom.percentualDesconto}%)
                </p>
              )}

              <div className="mb-4 space-y-1 text-sm text-gray-700">
                <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
                <p>Desconto: R$ {desconto.toFixed(2)}</p>
                <p className="font-bold">Total: R$ {total.toFixed(2)}</p>
              </div>

              <button
                type="button"
                disabled={carregando || carrinhoFinalizado || itens.length === 0}
                onClick={checkout}
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Finalizar compra
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
