import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Reactから通信を受け取る
app.post("/api/recommend", async (req, res) => {
    const checked = req.body;

    console.log(checked);

    res.json({
        message: "受け取りました",
    });
});

app.listen(3000, () => {
    console.log("Server Start!");
});