import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "../openapi.json";
import { routes } from "./infrastructure/routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(routes);

app.use(errorHandler);
