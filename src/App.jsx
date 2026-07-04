import { useState } from "react";
import CheckBox from "./CheckBox";

function App() {
    const [attendance, setAttendance] = useState(false);
    const [test, setTest] = useState(false);
    const [report, setReport] = useState(false);

    return (


        <div>
            <div>
                <h1>授業おすすめそん</h1>
            </div>

            <CheckBox
                text="出席"
                checked={attendance}
                onChange={(e) => setAttendance(e.target.checked)}
            />

            <CheckBox
                text="テスト"
                checked={test}
                onChange={(e) => setTest(e.target.checked)}
            />

            <CheckBox
                text="レポート"
                checked={report}
                onChange={(e) => setReport(e.target.checked)}
            />
        </div>
    );
}

export default App;