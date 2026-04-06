import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        [{ align: [] }],
        ["clean"],
    ],
};

const FORMATS = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "blockquote",
    "code-block",
    "link",
    "image",
    "align",
];

type BlogEditorProps = {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
};

function BlogEditorInner({
    value = "",
    onChange,
    placeholder,
}: BlogEditorProps) {
    const [localValue, setLocalValue] = useState(value);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isEditingRef = useRef(false);

    useEffect(() => {
        if (!isEditingRef.current) {
            setLocalValue(value || "");
        }
    }, [value]);

    const handleChange = useCallback((html: string) => {
        isEditingRef.current = true;
        setLocalValue(html);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isEditingRef.current = false;
            if (onChangeRef.current) {
                onChangeRef.current(html);
            }
        }, 300);
    }, []);

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
            className="admin-blog-quill"
        />
    );
}

const BlogEditor = memo(BlogEditorInner);
export default BlogEditor;
