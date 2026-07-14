import { useEffect, useState } from "react";
import { api } from "./services/api";
import { Produto } from "./types";

function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Produto[]>("/api/produtos")
      .then((response) => setProdutos(response.data))
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Catálogo de Produtos
        </h1>

        {carregando && <p className="text-gray-500">Carregando produtos...</p>}
        {erro && <p className="text-red-600">{erro}</p>}

        {!carregando && !erro && (
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
