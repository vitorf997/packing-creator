import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import packingListsRouter from "./routes/packingLists.js";
import clientsRouter from "./routes/clients.js";
import sizeMatrixesRouter from "./routes/sizeMatrixes.js";
import labelTemplatesRouter from "./routes/labelTemplates.js";
import { ensureBaseLabelTemplates } from "./services/labelTemplateService.js";

// Inicializa a app Express
const app = express();
const port = process.env.PORT || 5000;
const mongoUrl =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/packing_creator";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Endpoint de saúde para verificação rápida
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/packing-lists", packingListsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/size-matrixes", sizeMatrixesRouter);
app.use("/api/label-templates", labelTemplatesRouter);

mongoose
  .connect(mongoUrl)
  .then(async () => {
    await ensureBaseLabelTemplates();
    // Só iniciamos o servidor depois da ligação ao Mongo
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  })
  .catch((error) => {
    // Falha ao ligar ao Mongo — termina o processo
    console.error("Mongo connection error:", error);
    process.exit(1);
  });
