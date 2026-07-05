import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import Papa from "papaparse";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const CSV_PATH = "data/nihon_chs_general_education_syllabus_2026.csv";

async function loadSyllabusData() {
  const csvText = await fs.readFile(CSV_PATH, "utf-8");

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
}

function makeSyllabusText(rows) {
  return rows
    .map((row, index) => {
      return `
${index + 1}.
科目名: ${row["科目名"] || ""}
先生: ${row["先生"] || ""}
学期: ${row["学期"] || ""}
学年: ${row["学年"] || ""}
科目群: ${row["科目群"] || ""}
授業形態: ${row["授業形態"] || ""}
単位数: ${row["単位数"] || ""}
評価: ${row["評価"] || ""}
URL: ${row["URL"] || ""}
`;
    })
    .join("\n");
}

app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const syllabusRows = await loadSyllabusData();

    console.log("読み込んだシラバス件数:", syllabusRows.length);

    const syllabusText = makeSyllabusText(syllabusRows);

    const prompt = `
あなたは大学のシラバス検索を手伝うAIです。
以下のシラバスCSVの内容だけを参考にして、学生におすすめ授業を提案してください。

【重要ルール】
・存在しない授業名を作らない
・必ずCSVにある科目から選ぶ
・おすすめは3つまで
・科目名、先生、評価方法、理由、urlを答え、それぞれ改行する
・評価基準の希望に合うものを優先する
・Markdown記号（** や ---）は使わない
・番号付きで、普通の文章として出力する
・短くわかりやすく答える
・日本語で答える

【シラバス情報】
${syllabusText}

【学生の希望】
${message}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "hackathon-study",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json(data);
    }

    res.json({
      reply:
        data.choices?.[0]?.message?.content ||
        "返答を取得できませんでした。",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI API request failed" });
  }
});

app.listen(3001, () => {
  console.log("AI server running on http://localhost:3001");
});