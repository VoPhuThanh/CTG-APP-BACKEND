import express from "express";
import { prisma } from "./config/database";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "failed",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});