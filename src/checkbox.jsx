function CheckBox({ text, checked, onChange }) {
    return (
        <label>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />
            {text}
        </label>
    );
}

export default CheckBox;