import { PrismaClient } from "@prisma/client";
import produtos from "./seed-data/catalogoProdutos.json";
import cupons from "./seed-data/cupons.json";

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
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

if (require.main === module) {
  const prisma = new PrismaClient();

  seedDatabase(prisma)
    .catch((error) => {
      console.error("Erro ao executar o seed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
