import { useState } from "react";
import { askAI } from "./api";

function App() {
    const options = [
        { id: "attendance", text: "出席", keywords: ["出席", "参画", "リアクション", "平常"] },
        { id: "test", text: "テスト", keywords: ["テスト", "試験"] },
        { id: "report", text: "レポート", keywords: ["レポート", "課題"] },
    ];

    const ranks = [
        { id: "first", label: "第一希望" },
        { id: "second", label: "第二希望" },
    ];

    // 状態管理
    const [preferences, setPreferences] = useState({ first: "", second: "" });
    const [results, setResults] = useState([]); // 検索結果を格納する
    const [hasSearched, setHasSearched] = useState(false);

    // ラジオボタン変更
    const [preferences, setPreferences] = useState({
        first: "",
        second: "",
    });

    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (rankId, optionId) => {
        setPreferences({ ...preferences, [rankId]: optionId });
    };

    // 「評価」の文字列から各要素の割合（%）を抽出する関数
    const parseEvaluation = (evalText) => {
        const scores = { attendance: 0, test: 0, report: 0 };
        if (!evalText) return scores;

        const regex = /([^,、:：(（]+?)(?:\(|（|:|：)?(\d+)\s*%/g;
        let match;

        while ((match = regex.exec(evalText)) !== null) {
            const label = match[1].trim();
            const value = parseInt(match[2], 10);

            options.forEach(opt => {
                if (opt.keywords.some(keyword => label.includes(keyword))) {
                    scores[opt.id] += value;
                }
            });
        }
        return scores;
    };

    // 💡【新機能】自前の簡易CSVパース関数
    // 改行やカンマで単純に分割し、ヘッダーをキーにしたオブジェクトの配列を作る
    const parseCSVWithoutLibrary = (text) => {
        // 改行コード（Windows/Mac/Linux対応）で1行ずつに分割
        const lines = text.split(/\r?\n/);
        if (lines.length === 0 || !lines[0]) return [];

        // 1行目をヘッダー（列名）として取得
        const headers = lines[0].split(",").map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 空行はスキップ

            const values = line.split(",").map(v => v.trim());
            const row = {};

            // ヘッダーに対応する値をマッピング
            headers.forEach((header, index) => {
                row[header] = values[index] || "";
            });

            data.push(row);
        }
        return data;
    };

    // 決定ボタンが押された時の処理
    const handleSubmit = async () => {
        if (!preferences.first) {
            alert("第一希望は必ず選択してください。");
            return;
        }

        try {
            const response = await fetch("/nihon_chs_general_education_syllabus_2026.csv");
            if (!response.ok) {
                throw new Error("ファイルの取得に失敗しました。");
            }
            const csvText = await response.text();

            // 💡 papaparseの代わりに自前の関数でパース
            const parsedRows = parseCSVWithoutLibrary(csvText);

            // 評価基準のスコアを算出
            const parsedData = parsedRows.map(row => {
                const scores = parseEvaluation(row["評価"]);
                return { ...row, scores };
            });

            // ソートロジック
            const sortedData = parsedData.sort((a, b) => {
                const p1 = preferences.first;
                const p2 = preferences.second;

                if (b.scores[p1] !== a.scores[p1]) {
                    return b.scores[p1] - a.scores[p1]; // 第一希望の降順
                }
                if (p2 && b.scores[p2] !== a.scores[p2]) {
                    return b.scores[p2] - a.scores[p2]; // 第二希望の降順
                }
                return 0;
            });

            // 上位10件をセット
            setResults(sortedData.slice(0, 10));
            setHasSearched(true);
        } catch (error) {
            console.error("CSVの読み込み・パースエラー:", error);
            alert("CSVデータの読み込みに失敗しました。publicフォルダにファイルがあるか確認してください。");
    const getOptionText = (optionId) => {
        const option = options.find((item) => item.id === optionId);
        return option ? option.text : "未選択";
    };

    const handleSubmit = async () => {
        if (!preferences.first && !preferences.second) {
            alert("第一希望または第二希望を選択してください。");
            return;
        }

        const firstText = getOptionText(preferences.first);
        const secondText = getOptionText(preferences.second);

        const message = `
総合教育科目の中から、授業をおすすめしてください。

評価基準の希望は以下です。
第一希望: ${firstText}
第二希望: ${secondText}

条件に合う授業を、理由つきで3つほど教えてください。
`;

        try {
            setLoading(true);
            setAnswer("AIが考え中です...");

            const reply = await askAI(message);
            setAnswer(reply);
        } catch (error) {
            console.error(error);
            setAnswer("AIの取得に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "28px", color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "30px" }}>
                授業おすすめソン
            </h1>

            <h3 style={{ marginBottom: "20px", color: "#555" }}>
                評価基準の希望順位選択
            </h3>

            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "90px", flexShrink: 0, color: "#444" }}>
                    <span style={{ fontWeight: "bold", width: "90px", color: "#444" }}>
                        {rank.label}:
                    </span>

                    <div style={{ display: "flex", gap: "20px" }}>
                        {options.map((option) => (
                            <label key={option.id} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                                <input
                                    type="radio"
                                    name={rank.id}
                                    value={option.id}
                                    checked={preferences[rank.id] === option.id}
                                    onChange={() => handleChange(rank.id, option.id)}
                                    style={{ marginRight: "6px", width: "16px", height: "16px" }}
                                />
                                {option.text}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    marginTop: "10px",
                    marginBottom: "30px",
                    padding: "12px 28px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    backgroundColor: loading ? "#999" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
            >
                おすすめ授業を検索
            </button>

            {hasSearched && (
                <div>
                    <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "8px", marginBottom: "15px" }}>おすすめ授業トップ10</h3>
                    {results.length === 0 ? (
                        <p>該当する授業が見つかりませんでした。</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {results.map((course, index) => (
                                <div key={index} style={{ border: "1px solid #e0e0e0", borderRadius: "6px", padding: "15px", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <span style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                                            {index + 1}. {course["科目名"]}
                                        </span>
                                        <span style={{ fontSize: "14px", color: "#666", backgroundColor: "#f0f0f0", padding: "2px 8px", borderRadius: "12px" }}>
                                            {course["学期"]} / {course["授業形態"]} ({course["単位数"]}単位)
                                        </span>
                                    </div>
                                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#555" }}><strong>担当先生:</strong> {course["先生"]}</p>
                                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#555" }}><strong>評価内訳:</strong> {course["評価"]}</p>
                                    {course["URL"] && (
                                        <a href={course["URL"]} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#0056b3", textDecoration: "underline", display: "inline-block", marginTop: "5px" }}>
                                            シラバス詳細を見る ↗
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => {
                    if (!loading) e.target.style.backgroundColor = "#0056b3";
                }}
                onMouseOut={(e) => {
                    if (!loading) e.target.style.backgroundColor = "#007bff";
                }}
            >
                {loading ? "考え中..." : "決定"}
            </button>

            {answer && (
                <div
                    style={{
                        marginTop: "30px",
                        padding: "16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6"
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>AIのおすすめ</h3>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

export default App;