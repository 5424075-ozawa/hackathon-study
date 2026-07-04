import { useState } from "react";

function CheckBox({ text }) {
    const [checked, setChecked] = useState(false);

    return (
        <label>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            />
            {text}
        </label>
    );
}

export default CheckBox;