import { useEffect, useState } from "react";
import RichTextEditor from "../RichTextEditor";

type FillupEditorProps = {
    question_text: string;
    onChange: (v: string) => void;
};

function extractWords(text: string): string[] {
    const regex = /\{(.*?)\}/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match[1].trim() !== '') {
            matches.push(match[1].replace(/\s*\|\s*/g, '|').trim());
        }
    }

    return matches;
}

export default function FillupEditor({ question_text, onChange }: FillupEditorProps) {
    const [values, setValues] = useState<string[]>([]);

    useEffect(() => {
        if (question_text) {
            const words = extractWords(question_text);
            setValues(words);
        } else {
            setValues([]);
        }
    }, [question_text]);

    return (
        <div className="space-y-1">
            <p className="px-4 py-3 bg-neutral-100 rounded border border-dashed border-gray-300 mb-5 text-sm text-gray-600">
                Use {"{"} {"}"} brackets to identify the word(s) you would like to test,
                e.g. I {"{"}play{"}"} soccer. You can also specify multiple words using
                the | key, e.g. I {"{"}play | hate | love{"}"} soccer. In this case,
                play, love or hate will all be marked as correct. This option is useful
                for multiple spellings. However, lower case and upper case letters will
                be ignored.
            </p>
            
            <RichTextEditor
                value={question_text}
                onChange={onChange}
                placeholder="Nhập nội dung câu hỏi điền từ..."
            />
            
            {values.length > 0 && (
                <div className="p-2 bg-neutral-100 rounded border border-dashed border-gray-300 mt-5 flex gap-2 flex-wrap">
                    {values.map((word, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 bg-green-600 text-white rounded block text-sm"
                        >
                            {word}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
