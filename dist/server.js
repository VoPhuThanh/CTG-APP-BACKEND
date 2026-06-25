"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/health", async (req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: "ok",
            database: "connected",
        });
    }
    catch (error) {
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
