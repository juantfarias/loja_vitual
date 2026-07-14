import { RiAddLine, RiDeleteBinLine, RiSubtractLine } from "react-icons/ri";
import { formatarMoeda } from "@/lib/formatarMoeda";
import { getProdutoImagemUrl } from "@/lib/produtoImagem";
import { ItemCarrinhoDetalhado } from "@/types";

interface CartItemRowProps {
  item: ItemCarrinhoDetalhado;
  desabilitado: boolean;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onRemover: () => void;
}

export function CartItemRow({
  item,
  desabilitado,
  onIncrementar,
  onDecrementar,
  onRemover,
}: CartItemRowProps) {
  return (
    <div className="flex gap-3 py-4">
      <img
        src={getProdutoImagemUrl(item.produto.descricaoProduto)}
        alt={item.produto.descricaoProduto}
        className="h-16 w-16 shrink-0 rounded-md object-cover"
      />

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-foreground">
            {item.produto.descricaoProduto}
          </p>
          <button
            type="button"
            onClick={onRemover}
            disabled={desabilitado}
            aria-label="Remover item"
            className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {formatarMoeda(item.produto.precoLiquido)} / un.
        </p>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-border px-1">
            <button
              type="button"
              onClick={onDecrementar}
              disabled={desabilitado}
              aria-label="Diminuir quantidade"
              className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              <RiSubtractLine className="h-3.5 w-3.5" />
            </button>
            <span className="w-4 text-center text-sm tabular-nums">{item.quantidade}</span>
            <button
              type="button"
              onClick={onIncrementar}
              disabled={desabilitado}
              aria-label="Aumentar quantidade"
              className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              <RiAddLine className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="font-display text-sm tabular-nums text-foreground">
            {formatarMoeda(item.precoItem)}
          </span>
        </div>
      </div>
    </div>
  );
}
