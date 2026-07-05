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
        return matchedRows.slice(0, 10);
    }

    return rows.slice(0, 10);
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

function extractReply(data) {
    const choice = data?.choices?.[0];

    const content = choice?.message?.content;
    if (typeof content === "string" && content.trim()) {
        return content.trim();
    }

    if (Array.isArray(content)) {
        const joined = content
            .map((item) => {
                if (typeof item === "string") return item;
                if (typeof item?.text === "string") return item.text;
                if (typeof item?.content === "string") return item.content;
                return "";
            })
            .join("\n")
            .trim();

        if (joined) {
            return joined;
        }
    }

    const text = choice?.text;
    if (typeof text === "string" && text.trim()) {
        return text.trim();
    }

    return "";
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
考えている過程や比較検討の文章は絶対に書かない。
英語は絶対に使わない。
Markdownは絶対に使わない。
###、##、**、---、- は使わない。
存在しない授業名を作らない。
必ずシラバス情報にある科目から選ぶ。
おすすめは3つまで。
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
                        role: "system",
                        content:
                            "日本語だけで最終回答のみを出してください。考えている過程、比較検討、英語の説明は絶対に出力しないでください。",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.2,
                max_tokens: 400,
                reasoning: {
                    effort: "none",
                    exclude: true,
                },
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
                    detail: text.slice(0, 500),
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
            return new Response(
                JSON.stringify({
                    error: "OpenRouter API error",
                    detail: data,
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const reply = extractReply(data);

        if (!reply) {
            return new Response(
                JSON.stringify({
                    error: "OpenRouterから返答本文を取得できませんでした。",
                    detail: data,
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({
                reply,
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