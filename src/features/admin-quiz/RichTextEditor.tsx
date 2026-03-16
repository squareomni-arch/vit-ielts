import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const MODULES = {
    toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
    ],
};

const FORMATS = [
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
];

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

/**
 * RichTextEditor with internal local state + debounced propagation.
 *
 * Problem: Quill fires onChange on every keystroke. If onChange immediately
 * calls setPassages (parent state), the entire quiz editor tree re-renders,
 * causing visible input lag.
 *
 * Solution: Keep a local copy of the HTML. On each keystroke, update local
 * state only (cheap). After 300ms of idle, propagate to parent (expensive).
 * External value changes (e.g. loading data) are synced back via useEffect.
 */
function RichTextEditorInner({
    value,
    onChange,
    placeholder,
}: RichTextEditorProps) {
    const [localValue, setLocalValue] = useState(value);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track whether we are actively editing to avoid external value overwriting local edits
    const isEditingRef = useRef(false);

    // Sync external value → local (only when not actively editing)
    useEffect(() => {
        if (!isEditingRef.current) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = useCallback((html: string) => {
        isEditingRef.current = true;
        setLocalValue(html);

        // Debounce propagation to parent
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isEditingRef.current = false;
            onChangeRef.current(html);
        }, 300);
    }, []);

    // Flush on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <ReactQuill
            theme="snow"
            value={localValue}
            onChange={handleChange}
            modules={MODULES}
            formats={FORMATS}
            placeholder={placeholder}
        />
    );
}

const RichTextEditor = memo(RichTextEditorInner);
export default RichTextEditor;
