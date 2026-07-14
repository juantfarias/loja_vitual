import cors from "cors";
import express from "express";
import { routes } from "./infrastructure/routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use(routes);

app.use(errorHandler);
