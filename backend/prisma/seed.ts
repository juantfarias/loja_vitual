import { PrismaClient } from "@prisma/client";
import produtos from "./seed-data/catalogoProdutos.json";
import cupons from "./seed-data/cupons.json";

const prisma = new PrismaClient();

async function main() {
  await prisma.itemCarrinho.deleteMany();
  await prisma.carrinho.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.cupom.deleteMany();

  await prisma.produto.createMany({ data: produtos });
  await prisma.cupom.createMany({ data: cupons });

  console.log(
    `Seed concluido: ${produtos.length} produtos e ${cupons.length} cupons inseridos.`
  );
}

main()
  .catch((error) => {
    console.error("Erro ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
