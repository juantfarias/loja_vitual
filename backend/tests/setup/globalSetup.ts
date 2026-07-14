import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../../prisma/seed";

export default async function globalSetup(): Promise<void> {
  const envPath = path.resolve(__dirname, "../../.env.test");
  const { parsed } = dotenv.config({ path: envPath });

  if (!parsed?.CART_DATABASE_URL) {
    throw new Error(
      `CART_DATABASE_URL não encontrada em ${envPath}. Copie .env.test.example para .env.test.`
    );
  }

  const testEnv = { ...process.env, ...parsed };

  execSync("npx prisma migrate reset --force --skip-seed", {
    cwd: path.resolve(__dirname, "../.."),
    env: testEnv,
    stdio: "inherit",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: parsed.CART_DATABASE_URL } },
  });

  await seedDatabase(prisma);
  await prisma.$disconnect();
}
