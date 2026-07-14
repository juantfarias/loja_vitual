import { useState } from "react";
import {
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCoupon3Line,
  RiLoader4Line,
  RiShoppingBag3Line,
} from "react-icons/ri";
import { CartItemRow } from "@/components/CartItemRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatarMoeda } from "@/lib/formatarMoeda";
import { useCartStore } from "@/store/useCartStore";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
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
    updateItemQuantity,
    removeItemFromCart,
    applyCoupon,
    removeCoupon,
    checkout,
    limparCarrinho,
  } = useCartStore();

  const finalizado = status === "FINALIZADO";
  const carrinhoVazio = !cartId || itens.length === 0;

  function handleAplicarCupom() {
    if (!codigoCupom.trim()) return;
    applyCoupon(codigoCupom.trim());
    setCodigoCupom("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {carrinhoVazio && !finalizado && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <RiShoppingBag3Line className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              Seu carrinho está vazio.
              <br />
              Adicione produtos do catálogo pra começar.
            </p>
          </div>
        )}

        {finalizado && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <RiCheckboxCircleLine className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-lg text-foreground">Pedido finalizado!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Total: {formatarMoeda(total)}
              </p>
            </div>
            <Button variant="outline" className="mt-2" onClick={limparCarrinho}>
              Novo carrinho
            </Button>
          </div>
        )}

        {!carrinhoVazio && !finalizado && (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y divide-border">
                {itens.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    desabilitado={carregando}
                    onIncrementar={() => updateItemQuantity(item.id, item.quantidade + 1)}
                    onDecrementar={() =>
                      item.quantidade - 1 <= 0
                        ? removeItemFromCart(item.id)
                        : updateItemQuantity(item.id, item.quantidade - 1)
                    }
                    onRemover={() => removeItemFromCart(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4">
              <Separator />

              <div className="space-y-2">
                {cupom ? (
                  <div className="flex items-center justify-between rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                    <span className="flex items-center gap-1.5">
                      <RiCoupon3Line className="h-4 w-4" />
                      {cupom.codigoCupom} aplicado ({cupom.percentualDesconto}%)
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      disabled={carregando}
                      className="text-xs underline underline-offset-2 disabled:opacity-40"
                    >
                      remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código do cupom"
                      value={codigoCupom}
                      onChange={(event) => setCodigoCupom(event.target.value)}
                      disabled={carregando}
                      onKeyDown={(event) => event.key === "Enter" && handleAplicarCupom()}
                    />
                    <Button
                      variant="secondary"
                      disabled={carregando || !codigoCupom.trim()}
                      onClick={handleAplicarCupom}
                    >
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatarMoeda(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto</span>
                  <span className="tabular-nums">
                    {desconto > 0 ? `- ${formatarMoeda(desconto)}` : formatarMoeda(0)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-display text-base text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">{formatarMoeda(total)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                disabled={carregando}
                onClick={checkout}
              >
                {carregando ? (
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                ) : (
                  <RiCheckLine className="h-4 w-4" />
                )}
                Finalizar compra
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
