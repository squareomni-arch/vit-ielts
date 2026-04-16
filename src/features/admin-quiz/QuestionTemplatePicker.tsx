import { Modal } from "antd";
import { QUESTION_TEMPLATES, QuestionTemplate } from "./constants";

type Props = {
    open: boolean;
    onSelect: (template: QuestionTemplate) => void;
    onCancel: () => void;
};

// Group templates by underlying type for visual grouping
const GROUPS: { label: string; ids: string[] }[] = [
    {
        label: "Fill-in-the-blank",
        ids: ["summary_completion", "sentence_completion", "table_completion"],
    },
    {
        label: "Single Answer",
        ids: ["multiple_choice", "true_false_not_given", "yes_no_not_given"],
    },
    {
        label: "Multiple Answers",
        ids: ["checkbox_multi", "list_selection"],
    },
    {
        label: "Matching",
        ids: [
            "matching_headings",
            "matching_name",
            "matching_paragraph_information",
            "matching_sentence_endings",
        ],
    },
    {
        label: "Categorising",
        ids: ["choose_a_title"],
    },
];

export default function QuestionTemplatePicker({ open, onSelect, onCancel }: Props) {
    const templateMap = Object.fromEntries(QUESTION_TEMPLATES.map((t) => [t.id, t]));

    return (
        <Modal
            title="Choose Question Format"
            open={open}
            onCancel={onCancel}
            footer={null}
            width={760}
            centered
            destroyOnClose
        >
            <p className="text-gray-500 text-sm mb-6">
                Select the IELTS question format you want to create. The editor will configure itself automatically.
            </p>

            <div className="space-y-6">
                {GROUPS.map((group) => {
                    const templates = group.ids
                        .map((id) => templateMap[id])
                        .filter(Boolean);
                    if (!templates.length) return null;
                    return (
                        <div key={group.label}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                {group.label}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {templates.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => onSelect(tmpl)}
                                        className="flex items-start gap-3 text-left rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                                    >
                                        <span className="text-2xl leading-tight mt-0.5">{tmpl.icon}</span>
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm leading-snug">
                                                {tmpl.label}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                                                {tmpl.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
}
