import { memo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

type BlogEditorProps = {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    height?: number;
};

function BlogEditorInner({
    value = "",
    onChange,
    placeholder,
    height = 600,
}: BlogEditorProps) {
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
                    "undo redo | blocks fontfamily fontsize | " +
                    "bold italic underline strikethrough | forecolor backcolor | " +
                    "alignleft aligncenter alignright alignjustify | " +
                    "bullist numlist outdent indent | link image media codesample | " +
                    "removeformat | fullscreen | help",
                content_style:
                    "body { font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; }",
                inline_styles: true,
                entity_encoding: "raw",
                image_advtab: true,
                image_caption: true,
                min_height: 400,
                branding: false,
                paste_as_text: false,
                paste_word_valid_elements: "b,strong,i,em,h1,h2,h3,p,br,ul,ol,li,a,table,tr,td,th,thead,tbody",
            }}
            value={value}
            onEditorChange={(html) => onChange?.(html)}
        />
    );
}

const BlogEditor = memo(BlogEditorInner);
export default BlogEditor;
