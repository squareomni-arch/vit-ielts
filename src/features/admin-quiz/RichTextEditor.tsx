import { memo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
// Removed Next.js dynamic for Tinymce since it works well inside useEffect/component lifecycle with explicit script source.

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    height?: number;
};

function RichTextEditorInner({
    value,
    onChange,
    placeholder,
    height = 500,
}: RichTextEditorProps) {
    const editorRef = useRef<TinyMCEEditor>(null);

    const setRef = (_evt: unknown, editor: null | TinyMCEEditor) => {
        if (editorRef) {
            editorRef.current = editor as TinyMCEEditor;
        }
    };

    return (
        <Editor
            tinymceScriptSrc="/libs/tinymce/tinymce.min.js"
            licenseKey="gpl"
            onInit={setRef}
            init={{
                promotion: false,
                height,
                menubar: true,
                placeholder: placeholder || "",
                plugins:
                    "preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion",
                toolbar:
                    "undo redo | blocks | " +
                    "bold italic backcolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                inline_styles: true,
                entity_encoding: "raw",
                image_advtab: true,
                image_caption: true,
                min_height: 300,
                branding: false,
                paste_as_text: true,
                setup: (editor) => {
                    // You can define custom buttons or setups here (e.g., custom file picker)
                }
            }}
            value={value}
            onEditorChange={onChange}
        />
    );
}

const RichTextEditor = memo(RichTextEditorInner);
export default RichTextEditor;
