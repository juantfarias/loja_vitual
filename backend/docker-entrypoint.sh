#!/bin/sh
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Verificando se o banco precisa de seed..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.produto.count().then(async (count) => {
  if (count === 0) {
    console.log('Banco vazio, rodando seed...');
    require('child_process').execSync('npx prisma db seed', { stdio: 'inherit' });
  } else {
    console.log('Banco ja populado (' + count + ' produtos), pulando seed.');
  }
  await prisma.\$disconnect();
});
"

echo "Iniciando servidor..."
exec node dist/server.js
