import { RiCpuLine, RiShoppingBag3Line } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  quantidadeItens: number;
  onAbrirCarrinho: () => void;
}

export function Header({ quantidadeItens, onAbrirCarrinho }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <RiCpuLine className="h-5 w-5" />
          </span>
          <div className="leading-none">
            <p className="font-display text-lg font-medium tracking-tight text-foreground">
              Nexus
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Loja de teste
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="relative border-border bg-card"
          onClick={onAbrirCarrinho}
          aria-label="Abrir carrinho"
        >
          <RiShoppingBag3Line className="h-5 w-5" />
          {quantidadeItens > 0 && (
            <Badge
              key={quantidadeItens}
              className="absolute -right-2 -top-2 h-5 min-w-5 animate-badge-pop justify-center rounded-full px-1 text-[11px]"
            >
              {quantidadeItens}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
