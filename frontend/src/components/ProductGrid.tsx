import { RiErrorWarningLine } from "react-icons/ri";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Produto } from "@/types";

interface ProductGridProps {
  produtos: Produto[];
  carregando: boolean;
  erro: string | null;
  desabilitarAcoes: boolean;
  onAdicionar: (produtoId: number) => void;
}

export function ProductGrid({
  produtos,
  carregando,
  erro,
  desabilitarAcoes,
  onAdicionar,
}: ProductGridProps) {
  if (erro) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 py-16 text-center">
        <RiErrorWarningLine className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{erro}</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, indice) => (
          <div key={indice} className="overflow-hidden rounded-lg border border-border/70">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {produtos.map((produto, indice) => (
        <ProductCard
          key={produto.id}
          produto={produto}
          indice={indice}
          desabilitado={desabilitarAcoes}
          onAdicionar={() => onAdicionar(produto.id)}
        />
      ))}
    </div>
  );
}
