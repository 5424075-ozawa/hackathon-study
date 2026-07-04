import { useState } from "react";
import Papa from "papaparse"; // CSVをパースするためのライブラリ

function App() {
    // 選択肢（評価基準）
    const options = [
        { id: "attendance", text: "出席", keywords: ["出席", "参画", "リアクション", "平常"] },
        { id: "test", text: "テスト", keywords: ["テスト", "試験"] },
        { id: "report", text: "レポート", keywords: ["レポート", "課題"] },
    ];

    // 希望のランク
    const ranks = [
        { id: "first", label: "第一希望" },
        { id: "second", label: "第二希望" },
    ];

    // 状態管理
    const [preferences, setPreferences] = useState({ first: "", second: "" });
    const [results, setResults] = useState([]); // 検索結果を格納する
    const [hasSearched, setHasSearched] = useState(false);

    // ラジオボタン変更
    const handleChange = (rankId, optionId) => {
        setPreferences({ ...preferences, [rankId]: optionId });
    };

    // 「評価」の文字列から各要素の割合（%）を抽出する関数
    const parseEvaluation = (evalText) => {
        const scores = { attendance: 0, test: 0, report: 0 };
        if (!evalText) return scores;

        // 「項目(〇〇%)」や「項目:〇〇%」のようなパターンを抽出
        const regex = /([^,、:：(（]+?)(?:\(|（|:|：)?(\d+)\s*%/g;
        let match;

        while ((match = regex.exec(evalText)) !== null) {
            const label = match[1].trim();
            const value = parseInt(match[2], 10);

            // キーワードマッチングでどの評価基準に該当するか判定
            options.forEach(opt => {
                if (opt.keywords.some(keyword => label.includes(keyword))) {
                    scores[opt.id] += value;
                }
            });
        }
        return scores;
    };

    // 決定ボタンが押された時の処理
    const handleSubmit = async () => {
        if (!preferences.first) {
            alert("第一希望は必ず選択してください。");
            return;
        }

        try {
            // パブリックフォルダ等に配置したCSVファイルを読み込む
            // (※実装時は public/nihon_chs_general_education_syllabus_2026.csv にファイルを置くか、
            //   もしくは input type="file" で読み込ませる形にしてください)
            const response = await fetch("/nihon_chs_general_education_syllabus_2026.csv");
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData = results.data.map(row => {
                        const scores = parseEvaluation(row["評価"]);
                        return { ...row, scores };
                    });

                    // ソートロジック:
                    // 1. 第一希望の割合が高い順
                    // 2. 第一希望が同じなら、第二希望の割合が高い順
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
                }
            });
        } catch (error) {
            console.error("CSVの読み込みエラー:", error);
            alert("CSVデータの読み込みに失敗しました。publicフォルダにファイルがあるか確認してください。");
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
            {/* アプリタイトル */}
            <h1 style={{ fontSize: "28px", color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "30px" }}>
                授業おすすめソン
            </h1>

            <h3 style={{ marginBottom: "20px", color: "#555" }}>評価基準の希望順位選択</h3>
            
            {ranks.map((rank) => (
                <div key={rank.id} style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", width: "90px", shrink: 0, color: "#444" }}>
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

            {/* 決定ボタン */}
            <button
                onClick={handleSubmit}
                style={{
                    marginTop: "10px",
                    marginBottom: "30px",
                    padding: "12px 28px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
                おすすめ授業を検索
            </button>

            {/* 結果表示エリア */}
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
                </div>
            )}
        </div>
    );
}

export default App;

//d