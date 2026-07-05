import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

const CSV_PATH = path.join(
    process.cwd(),
    "data",
    "nihon_chs_general_education_syllabus_2026.csv"
);

let cachedSyllabusRows = null;

async function loadSyllabusData() {
    if (cachedSyllabusRows) {
        return cachedSyllabusRows;
    }

    const csvText = await fs.readFile(CSV_PATH, "utf-8");

    const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    });

    cachedSyllabusRows = parsed.data;
    return cachedSyllabusRows;
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

export default async (request) => {
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method Not Allowed" }),
            {
                status: 405,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        const { message } = await request.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: "message is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return new Response(
                JSON.stringify({ error: "OPENROUTER_API_KEY is not set" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const syllabusRows = await loadSyllabusData();
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

シラバス情報:
${syllabusText}

学生の希望:
${message}
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://netlify.app",
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
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(
            JSON.stringify({
                reply:
                    data.choices?.[0]?.message?.content ||
                    "返答を取得できませんでした。",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "AI function failed",
                detail: error.message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};