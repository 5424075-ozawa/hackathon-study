export async function askAI(message) {
    try {
        const response = await fetch("/.netlify/functions/ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
            }),
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("JSONではないレスポンス:", text);
            return "AIサーバー側でエラーが発生しました。Netlify Functionsのログを確認してください。";
        }

        if (!response.ok) {
            console.error("AI API Error:", data);
            return data.error || data.detail || "AIの取得に失敗しました。";
        }

        return data.reply;
    } catch (error) {
        console.error("通信エラー:", error);
        return "サーバーとの通信に失敗しました。";
    }
}