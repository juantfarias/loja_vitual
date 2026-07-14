import cors from "cors";
import "dotenv/config";
import express from "express";
import { routes } from "./infrastructure/routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use(routes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
