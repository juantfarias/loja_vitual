import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const produtos = [
  { descricaoProduto: "Camiseta Basica", quantidadeEstoque: 50, precoLiquido: 49.9 },
  { descricaoProduto: "Calca Jeans", quantidadeEstoque: 30, precoLiquido: 129.9 },
  { descricaoProduto: "Tenis Esportivo", quantidadeEstoque: 20, precoLiquido: 249.9 },
  { descricaoProduto: "Jaqueta Corta-Vento", quantidadeEstoque: 15, precoLiquido: 189.9 },
  { descricaoProduto: "Bone Aba Reta", quantidadeEstoque: 60, precoLiquido: 39.9 },
  { descricaoProduto: "Meia Cano Alto (Par)", quantidadeEstoque: 100, precoLiquido: 14.9 },
  { descricaoProduto: "Mochila Notebook", quantidadeEstoque: 25, precoLiquido: 159.9 },
  { descricaoProduto: "Relogio Digital", quantidadeEstoque: 10, precoLiquido: 299.9 },
  { descricaoProduto: "Oculos de Sol", quantidadeEstoque: 40, precoLiquido: 89.9 },
  { descricaoProduto: "Garrafa Termica 1L", quantidadeEstoque: 35, precoLiquido: 69.9 },
];

const cupons = [
  { codigoCupom: "10OFF", percentualDesconto: 10 },
  { codigoCupom: "15OFF", percentualDesconto: 15 },
];

async function main() {
  await prisma.itemCarrinho.deleteMany();
  await prisma.carrinho.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.cupom.deleteMany();

  await prisma.produto.createMany({ data: produtos });
  await prisma.cupom.createMany({ data: cupons });

  console.log("Seed concluido: 10 produtos e 2 cupons inseridos.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
