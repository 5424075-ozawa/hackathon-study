const API_BASE_URL = "http://localhost:3001";

export async function askAI(message) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("AI API Error:", data);
            return "AIの取得に失敗しました。";
        }

        return data.reply;
    } catch (error) {
        console.error("通信エラー:", error);
        return "サーバーとの通信に失敗しました。";
    }
}