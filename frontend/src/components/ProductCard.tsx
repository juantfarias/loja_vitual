import { RiAddLine, RiLoader4Line } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/formatarMoeda";
import { getProdutoImagemUrl } from "@/lib/produtoImagem";
import { Produto } from "@/types";

interface ProductCardProps {
  produto: Produto;
  indice: number;
  desabilitado: boolean;
  onAdicionar: () => void;
}

export function ProductCard({ produto, indice, desabilitado, onAdicionar }: ProductCardProps) {
  const estoqueBaixo = produto.quantidadeEstoque > 0 && produto.quantidadeEstoque <= 5;
  const semEstoque = produto.quantidadeEstoque === 0;

  return (
    <Card
      className="group animate-fade-up overflow-hidden border-border/70 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(indice, 10) * 70}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <img
          src={getProdutoImagemUrl(produto.descricaoProduto)}
          alt={produto.descricaoProduto}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <Badge
          variant={semEstoque ? "destructive" : estoqueBaixo ? "destructive" : "secondary"}
          className="absolute left-3 top-3 bg-card/90 text-foreground backdrop-blur-sm"
        >
          {semEstoque
            ? "Esgotado"
            : estoqueBaixo
              ? `Últimas ${produto.quantidadeEstoque}`
              : `${produto.quantidadeEstoque} em estoque`}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h3 className="font-display text-base font-medium leading-snug text-foreground">
          {produto.descricaoProduto}
        </h3>

        <div className="flex items-center justify-between">
          <span className="font-display text-lg tabular-nums text-foreground">
            {formatarMoeda(Number(produto.precoLiquido))}
          </span>
          <Button
            size="sm"
            disabled={desabilitado || semEstoque}
            onClick={onAdicionar}
            className="gap-1.5"
          >
            {desabilitado ? (
              <RiLoader4Line className="h-4 w-4 animate-spin" />
            ) : (
              <RiAddLine className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </div>
      </div>
    </Card>
  );
}
