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

function pickRelevantRows(rows, message) {
    const keywords = message
        .replace(/[、。！？\s]/g, " ")
        .split(" ")
        .filter((word) => word.length >= 2);

    const scoredRows = rows.map((row) => {
        const text = `
${row["科目名"] || ""}
${row["先生"] || ""}
${row["学期"] || ""}
${row["学年"] || ""}
${row["科目群"] || ""}
${row["授業形態"] || ""}
${row["単位数"] || ""}
${row["評価"] || ""}
${row["URL"] || ""}
`.toLowerCase();

        let score = 0;

        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                score += 2;
            }
        }

        if (message.includes("レポート") && text.includes("レポート")) {
            score += 5;
        }

        if (
            (message.includes("テスト") || message.includes("試験")) &&
            (text.includes("テスト") || text.includes("試験"))
        ) {
            score += 5;
        }

        if (message.includes("出席") && text.includes("出席")) {
            score += 4;
        }

        if (message.includes("オンデマンド") && text.includes("オンデマンド")) {
            score += 5;
        }

        if (message.includes("楽") && text.includes("楽")) {
            score += 2;
        }

        return {
            row,
            score,
        };
    });

    const matchedRows = scoredRows
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.row);

    if (matchedRows.length > 0) {
        return matchedRows.slice(0, 20);
    }

    return rows.slice(0, 20);
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

export default async function handler(request) {
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({
                error: "Method Not Allowed",
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }

    try {
        const { message } = await request.json();

        if (!message) {
            return new Response(
                JSON.stringify({
                    error: "message is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return new Response(
                JSON.stringify({
                    error: "OPENROUTER_API_KEY is not set",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const syllabusRows = await loadSyllabusData();
        const relevantRows = pickRelevantRows(syllabusRows, message);
        const syllabusText = makeSyllabusText(relevantRows);

        const prompt = `
あなたは大学のシラバス検索を手伝うAIです。
以下のシラバス情報だけを参考にして、学生におすすめ授業を提案してください。

重要ルール:
Markdownは絶対に使わない。
###、##、**、---、- は使わない。
存在しない授業名を作らない。
必ずシラバス情報にある科目から選ぶ。
おすすめは3つまで。
1件あたり4行以内。
理由は1文だけ。
日本語で短く答える。
URLはシラバス情報にあるものをそのまま使う。

出力形式:
1. 科目名：
先生：
評価：
理由：
URL：

2. 科目名：
先生：
評価：
理由：
URL：

3. 科目名：
先生：
評価：
理由：
URL：

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
                temperature: 0.3,
                max_tokens: 700,
            }),
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return new Response(
                JSON.stringify({
                    error: "OpenRouter returned non JSON response",
                    detail: text.slice(0, 300),
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (!response.ok) {
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    "Content-Type": "application/json",
                },
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
                headers: {
                    "Content-Type": "application/json",
                },
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
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}