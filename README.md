# Loja Virtual — Carrinho de Compras

Aplicação full-stack de e-commerce: catálogo de produtos com imagens, carrinho de compras persistido no banco, cupons de desconto e checkout. Toda a matemática (subtotal, desconto, total) e as validações de negócio (estoque, imutabilidade pós-checkout) vivem no back-end — o front-end só reflete o que a API retorna.

## Stack

**Back-end**
- Node.js + TypeScript (strict mode)
- Express
- PostgreSQL 15 (containerizado via Docker Compose)
- Prisma ORM

**Front-end**
- React + TypeScript (strict mode) + Vite
- Zustand (estado do carrinho)
- Axios
- Tailwind CSS + shadcn/ui (componentes)
- Remix Icon (`react-icons/ri`)

## Arquitetura

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐      Prisma      ┌────────────┐
│  Front-end  │  ────────────────▶  │   Back-end   │  ─────────────▶  │ PostgreSQL │
│ React+Vite  │  ◀────────────────  │ Express+TS   │  ◀─────────────  │  (Docker)  │
│  :5173      │                     │    :3333     │                  │   :5434    │
└─────────────┘                     └──────────────┘                  └────────────┘
```

O front-end não tem credenciais de banco; o back-end não renderiza HTML. Comunicação exclusivamente via API REST.

### Back-end — Clean Architecture simplificada

```
backend/src/
├── server.ts                    # entrypoint Express: CORS, JSON, rotas, error handler
├── infrastructure/
│   ├── routes.ts                # define todos os endpoints e liga ao controller/service
│   └── prisma/client.ts         # singleton do PrismaClient
├── controllers/
│   └── CarrinhoController.ts    # adapta request/response HTTP ↔ CarrinhoService
├── services/
│   ├── ProdutoService.ts        # leitura de produtos
│   └── CarrinhoService.ts       # motor de regras do carrinho (transacional)
├── middlewares/
│   └── errorHandler.ts          # captura AppError e erros do Prisma, formata resposta
└── shared/
    ├── AppError.ts              # classe de erro padronizada
    └── uuid.ts                  # validação de UUID nos params (evita erro cru do Postgres)
```

Fluxo de uma requisição: `routes.ts` → `controller` (extrai params/body, chama o service, repassa erros) → `service` (regras de negócio + Prisma) → resposta JSON. Toda mutação de carrinho roda dentro de `prisma.$transaction`, garantindo atomicidade entre `Carrinho` e `ItemCarrinho`.

### Front-end

```
frontend/src/
├── App.tsx                  # layout: header, catálogo, drawer do carrinho
├── components/
│   ├── ui/                  # primitivos shadcn (button, card, sheet, input, badge...)
│   ├── Header.tsx           # topo fixo + ícone do carrinho com badge
│   ├── ProductGrid.tsx      # grid do catálogo (loading/erro/dados)
│   ├── ProductCard.tsx      # card de produto (imagem, preço, estoque, adicionar)
│   ├── CartSheet.tsx        # drawer lateral do carrinho (cupom, totais, checkout)
│   └── CartItemRow.tsx      # linha de item dentro do carrinho
├── store/
│   └── useCartStore.ts      # estado global do carrinho (Zustand) + chamadas à API
├── services/
│   └── api.ts               # instância Axios (baseURL, interceptor de erro)
├── lib/
│   ├── formatarMoeda.ts     # Intl.NumberFormat pt-BR/BRL
│   ├── produtoImagem.ts     # mapa produto → imagem (Unsplash)
│   └── utils.ts             # helper cn() (classnames)
└── types/
    └── index.ts             # interfaces TypeScript espelhando os contratos da API
```

O carrinho é 100% controlado pelo back-end: o Zustand nunca calcula preço, desconto ou total — ele só guarda o que a API devolve após cada ação (`addItemToCart`, `updateItemQuantity`, `removeItemFromCart`, `applyCoupon`, `removeCoupon`, `checkout`).

## Modelo de dados

| Modelo         | Campos                                                                                   |
|----------------|-------------------------------------------------------------------------------------------|
| `Produto`      | `id` (Int, autoincrement), `descricaoProduto`, `quantidadeEstoque` (Int), `precoLiquido` (Decimal) |
| `Cupom`        | `id` (Int, autoincrement), `codigoCupom` (único), `percentualDesconto` (Decimal)          |
| `Carrinho`     | `id` (UUID), `status` (`ABERTO`/`FINALIZADO`), `subtotal`, `desconto`, `total` (Decimal), `cupomId` (Int, opcional) |
| `ItemCarrinho` | `id` (UUID), `carrinhoId` (UUID), `produtoId` (Int), `quantidade` (Int), `precoItem` (Decimal) |

`Produto` e `Cupom` usam `id` numérico porque são catálogo estático, seedado a partir de `backend/prisma/seed-data/catalogoProdutos.json` e `cupons.json` (arquivos fornecidos, com os mesmos `id`s preservados no seed). `Carrinho` e `ItemCarrinho` são entidades criadas em runtime e usam UUID.

Valores monetários são `Decimal` no banco e nos cálculos (nunca `float`, para evitar erro de arredondamento); a API converte para `number` só na resposta JSON.

## Como rodar o projeto

Pré-requisitos: Node.js 18+, Docker e Docker Compose.

### Opção rápida — tudo no Docker

```bash
docker-compose up -d --build
```

Sobe banco + migrations + seed automático (só na primeira vez, se o banco estiver vazio) + API + front, tudo de uma vez — `http://localhost:5173` (front) e `http://localhost:3333` (API) prontos em poucos minutos. **Sem hot-reload**: os containers rodam a imagem buildada; pra ver uma mudança de código refletida, roda `docker-compose up -d --build` de novo. Pra iteração rápida com hot-reload, use o fluxo manual abaixo.

### Fluxo manual (com hot-reload)

#### 1. Banco de dados

```bash
docker-compose up -d postgres
```

Sobe só o Postgres 15 na porta `5434` do host (mapeada para a `5432` do container), usuário/senha `docker`/`docker`, banco `cart_db`. (O `docker-compose.yml` também tem serviços `backend`/`frontend` — usados pela opção rápida acima; aqui especificamos `postgres` pra não subir os três.)

#### 2. Back-end

```bash
cd backend
npm install
cp .env.example .env      # já vem preenchido para rodar com o docker-compose acima
npm run migrate           # cria as tabelas
npm run seed               # popula produtos e cupons a partir de prisma/seed-data/*.json
npm run dev                 # http://localhost:3333
```

#### 3. Front-end

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Abra `http://localhost:5173` — o catálogo carrega os produtos reais do banco.

#### 4. Testes (back-end)

```bash
cd backend
cp .env.test.example .env.test   # aponta pra um banco de teste isolado (cart_db_test)
npm test                          # roda a suite de integração inteira
```

Suite de integração em cascata (`backend/tests/`), rodando com Vitest + Supertest direto contra o app Express (sem porta real). Antes de cada execução, o `globalSetup` reseta e re-seeda automaticamente o banco `cart_db_test` — **nunca** toca no `cart_db` de desenvolvimento (bancos diferentes, mesma instância do Postgres). `carrinho.cascade.test.ts` percorre uma sessão completa (criar carrinho, somar/substituir quantidade, estoque, cupom, remoção, checkout, imutabilidade pós-checkout), com cada etapa reaproveitando o estado (`cartId`/`itemId`) da etapa anterior.

### Variáveis de ambiente (`backend/.env`)

| Variável            | Descrição                                      | Exemplo                                                              |
|---------------------|-------------------------------------------------|------------------------------------------------------------------------|
| `CART_DATABASE_URL` | String de conexão do Postgres usada pelo Prisma | `postgresql://docker:docker@localhost:5434/cart_db?schema=public`     |
| `PORT`              | Porta do servidor Express                        | `3333`                                                                 |

## API

Base URL: `http://localhost:3333`.

> **Documentação interativa (Swagger):** com o back-end rodando, abra `http://localhost:3333/api/docs` — schemas, exemplos e "try it out" pra cada rota, gerados a partir de `backend/openapi.json`. A referência abaixo cobre a mesma informação em prosa, incluindo o raciocínio por trás de cada regra.

### Formato de erro

Toda resposta de erro (qualquer rota) segue o mesmo formato, produzido pelo `errorHandler` global:

```json
{ "error": "TipoDoErro", "message": "Descrição legível." }
```

| Status | `error`               | Quando acontece                                                                 |
|--------|------------------------|-----------------------------------------------------------------------------------|
| `400`  | `BadRequest`           | `quantidade` ausente/não-inteira/≤ 0, ou `codigoCupom` vazio                     |
| `404`  | `NotFound`             | `cartId`/`itemId` inexistente **ou malformado** (UUID inválido); `produtoId` inexistente **ou malformado** (não é inteiro positivo); `codigoCupom` que não existe |
| `409`  | `Conflict`             | Qualquer mutação (`POST`/`PUT`/`DELETE`) num carrinho com `status: "FINALIZADO"` |
| `422`  | `UnprocessableEntity`  | Quantidade solicitada (já somada, no caso de adição) excede `quantidadeEstoque`   |
| `500`  | `InternalServerError`  | Erro inesperado não mapeado                                                       |

`cartId`/`itemId` (UUID) e `produtoId` (inteiro) são validados por formato antes de qualquer consulta ao banco — um valor malformado retorna `404` (`"cartId inválido."`, `"produtoId inválido."`) em vez de estourar erro cru do Postgres.

---

### `GET /api/health`

Checagem de status do servidor.

**Resposta `200`**
```json
{ "status": "ok" }
```

---

### `GET /api/produtos`

Lista todos os produtos cadastrados.

**Resposta `200`**
```json
[
  {
    "id": 1,
    "descricaoProduto": "Notebook Dell Inspiron 15",
    "quantidadeEstoque": 8,
    "precoLiquido": "3499.9"
  }
]
```
> Nesta rota o Prisma serializa `precoLiquido` (tipo `Decimal`) como **string** — diferente das rotas de carrinho abaixo, que convertem para `number` na resposta.

---

### Carrinho — formato de resposta comum

**Toda** rota de mutação de carrinho (todas as listadas a seguir) devolve o **carrinho completo** neste formato, para o front-end substituir o estado local por inteiro:

```json
{
  "id": "fe247a7f-868a-45fc-aced-b4b78d3bb90f",
  "status": "ABERTO",
  "subtotal": 6999.8,
  "desconto": 699.98,
  "total": 6299.82,
  "cupom": { "codigoCupom": "10OFF", "percentualDesconto": 10 },
  "itens": [
    {
      "id": "90b8ea84-0cdc-4d18-b2ce-950edc96993b",
      "produto": {
        "id": 1,
        "descricaoProduto": "Notebook Dell Inspiron 15",
        "precoLiquido": 3499.9,
        "quantidadeEstoque": 8
      },
      "quantidade": 2,
      "precoItem": 6999.8
    }
  ]
}
```

`status` é sempre `"ABERTO"` ou `"FINALIZADO"`. `cupom` é `null` quando nenhum cupom está aplicado.

---

### `POST /api/carrinhos`

Cria um carrinho novo já com o primeiro item.

**Body**
```json
{ "produtoId": 1, "quantidade": 2 }
```

**Resposta `201`** — carrinho completo (formato acima), com 1 item.

**Erros**
| Status | Causa                                              | Exemplo de `message`                                  |
|--------|------------------------------------------------------|-----------------------------------------------------------|
| `400`  | `quantidade` ausente, não-inteira ou ≤ 0             | `"quantidade deve ser maior que zero."`                    |
| `404`  | `produtoId` não é inteiro positivo, ou inexistente   | `"produtoId inválido."` / `"produtoId não encontrado."`   |
| `422`  | `quantidade` maior que o estoque do produto          | `"Quantidade solicitada excede o estoque disponível."`    |

---

### `GET /api/carrinhos/:cartId`

Recupera o estado atual de um carrinho (usado pelo front para restaurar o carrinho salvo no `localStorage` após um refresh de página). Funciona tanto para carrinhos `ABERTO` quanto `FINALIZADO` — é leitura, não sofre a trava de imutabilidade.

**Sem body.**

**Resposta `200`** — carrinho completo (formato acima).

**Erros**
| Status | Causa                              |
|--------|--------------------------------------|
| `404`  | `cartId` malformado ou inexistente  |

---

### `DELETE /api/carrinhos/:cartId`

Exclui um carrinho por completo (usado pelo botão "esvaziar"/"Novo carrinho" no front, para não deixar carrinhos abandonados acumulando no banco).

**Sem body.**

**Resposta `200`** — o carrinho como estava momentos antes de ser excluído.

**Erros**
| Status | Causa                                                        |
|--------|-----------------------------------------------------------------|
| `404`  | `cartId` malformado ou inexistente                               |
| `409`  | Carrinho com `status: "FINALIZADO"` (`"Não é possível excluir um carrinho finalizado."`) — pedidos concluídos são preservados, nunca apagados |

---

### `POST /api/carrinhos/:cartId/itens`

Adiciona um item a um carrinho existente. Se o produto já estiver no carrinho, a quantidade enviada é **somada** à atual (a validação de estoque usa o total já somado).

**Body**
```json
{ "produtoId": 1, "quantidade": 1 }
```

**Resposta `200`** — carrinho completo atualizado.

**Erros**
| Status | Causa                                                         |
|--------|-----------------------------------------------------------------|
| `400`  | `quantidade` ausente, não-inteira ou ≤ 0                        |
| `404`  | `cartId` malformado/inexistente, ou `produtoId` inválido/inexistente |
| `409`  | Carrinho com `status: "FINALIZADO"` (`"Carrinho já finalizado."`) |
| `422`  | Quantidade somada excede o estoque                               |

---

### `PUT /api/carrinhos/:cartId/itens/:itemId`

Substitui a quantidade de um item já existente no carrinho (não soma — define o valor exato).

**Body**
```json
{ "quantidade": 5 }
```

**Resposta `200`** — carrinho completo atualizado.

**Erros**
| Status | Causa                                                        |
|--------|------------------------------------------------------------------|
| `400`  | `quantidade` ausente, não-inteira ou ≤ 0                         |
| `404`  | `cartId`/`itemId` malformado/inexistente (`"itemId não encontrado."`) |
| `409`  | Carrinho já finalizado                                            |
| `422`  | Nova quantidade excede o estoque do produto                       |

---

### `DELETE /api/carrinhos/:cartId/itens/:itemId`

Remove um item do carrinho. Se for o último item, `subtotal`, `desconto` e `total` voltam a `0` (o cupom, se houver, permanece vinculado).

**Sem body.**

**Resposta `200`** — carrinho completo atualizado.

**Erros**
| Status | Causa                                                     |
|--------|--------------------------------------------------------------|
| `404`  | `cartId`/`itemId` malformado/inexistente (`"itemId não encontrado."`) |
| `409`  | Carrinho já finalizado                                        |

---

### `POST /api/carrinhos/:cartId/cupom`

Aplica um cupom ao carrinho. Se já houver um cupom vinculado, ele é substituído pelo novo.

**Body**
```json
{ "codigoCupom": "10OFF" }
```

**Resposta `200`** — carrinho completo, `desconto`/`total` recalculados.

**Erros**
| Status | Causa                                                    |
|--------|---------------------------------------------------------|
| `400`  | `codigoCupom` ausente/vazio                              |
| `404`  | `cartId` malformado/inexistente, ou cupom inexistente (`"Cupom inválido."`) |
| `409`  | Carrinho já finalizado                                    |

---

### `DELETE /api/carrinhos/:cartId/cupom`

Remove o cupom aplicado (`desconto` volta a `0`, `total` volta a igualar o `subtotal`).

**Sem body.**

**Resposta `200`** — carrinho completo atualizado.

**Erros**
| Status | Causa                            |
|--------|-----------------------------------|
| `404`  | `cartId` malformado/inexistente  |
| `409`  | Carrinho já finalizado             |

---

### `POST /api/carrinhos/:cartId/checkout`

Finaliza o carrinho: `status` vira `"FINALIZADO"`, travando qualquer mutação futura.

**Sem body.**

**Resposta `200`** — carrinho completo, com `"status": "FINALIZADO"`.

**Erros**
| Status | Causa                                                    |
|--------|-----------------------------------------------------------|
| `404`  | `cartId` malformado/inexistente                           |
| `409`  | Carrinho **já** finalizado (checkout não é idempotente)  |

---

### Resumo das rotas

| Método   | Rota                                    | Body                              |
|----------|-------------------------------------------|-------------------------------------|
| `GET`    | `/api/health`                             | —                                    |
| `GET`    | `/api/produtos`                           | —                                    |
| `POST`   | `/api/carrinhos`                          | `{ "produtoId", "quantidade" }`     |
| `GET`    | `/api/carrinhos/:cartId`                  | —                                    |
| `DELETE` | `/api/carrinhos/:cartId`                  | —                                    |
| `POST`   | `/api/carrinhos/:cartId/itens`            | `{ "produtoId", "quantidade" }`     |
| `PUT`    | `/api/carrinhos/:cartId/itens/:itemId`    | `{ "quantidade" }`                  |
| `DELETE` | `/api/carrinhos/:cartId/itens/:itemId`    | —                                    |
| `POST`   | `/api/carrinhos/:cartId/cupom`            | `{ "codigoCupom" }`                 |
| `DELETE` | `/api/carrinhos/:cartId/cupom`            | —                                    |
| `POST`   | `/api/carrinhos/:cartId/checkout`         | —                                    |

### Regras de negócio

- **Preço do item:** `precoItem = precoLiquido × quantidade`.
- **Totais:** `subtotal = Σ precoItem`; `desconto = subtotal × (percentualDesconto / 100)`; `total = subtotal − desconto`.
- **Adicionar vs. atualizar:** `POST` soma a quantidade enviada à já existente no carrinho; `PUT` substitui.
- **Estoque:** validado em tempo real a cada adição/atualização, contra `quantidadeEstoque` do produto.
- **Carrinho finalizado:** nenhuma rota de mutação (`POST`/`PUT`/`DELETE` de itens/cupom) pode alterar um carrinho `FINALIZADO`.
- **Persistência client-side:** o front salva o `cartId` no `localStorage` e o restaura via `GET /api/carrinhos/:cartId` ao carregar a página — o carrinho sobrevive a um refresh. Carrinhos `FINALIZADO` nunca podem ser excluídos (`DELETE` retorna 409); carrinhos `ABERTO` podem, e é isso que o botão "esvaziar"/"Novo carrinho" faz no front, para não acumular carrinhos abandonados no banco.

## Versionamento

Versionamento simples: commits direto na `main`, sem branch por feature. Em troca, todo commit segue convenção clara — `tipo: descrição objetiva do que mudou` (`feat`, `fix`, `refactor`, etc.), sempre em português, sempre descrevendo a mudança de forma assertiva. Exemplos reais do histórico:

```
feat: implementando regras de negocio
refactor: reformulando frontend
fix: ajustando DTO carrinho
feat: consumindo .json para alimentar banco
fix: ajustando notificação de cupom invalido
feat: implementando testes
feat: consumindo dados persistidos do carrinho
fix: ajustando problemas de compatibilidade
```
