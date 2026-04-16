import { Radio, Checkbox, Input, Select, Table } from "antd";
import parse, { HTMLReactParserOptions } from "html-react-parser";
import type { QuestionData } from "./types";

type QuestionPreviewProps = {
    data: QuestionData;
};

export default function QuestionPreview({ data }: QuestionPreviewProps) {
    if (!data.type) return null;

    const renderRichText = (value?: string, fallback?: string) => {
        const trimmed = value?.trim();
        if (!trimmed) return fallback ?? null;
        return parse(trimmed);
    };

    const renderFillup = () => {
        const rawContent = data.question_text || "";
        let componentIndex = 0;

        const options: HTMLReactParserOptions = {
            replace(domNode) {
                if (domNode.type === "text" && domNode.data) {
                    const parts = domNode.data.split(/(\{.*?\})/);
                    if (parts.length > 1) {
                        return (
                            <>
                                {parts.map((part, i) => {
                                    if (part.startsWith("{") && part.endsWith("}")) {
                                        const qNum = ++componentIndex;
                                        return (
                                            <Input
                                                key={`fillup-${i}`}
                                                size="small"
                                                addonBefore={`Q.${qNum}`}
                                                className="w-fit inline-block mx-1 align-middle"
                                                placeholder="..."
                                                readOnly
                                            />
                                        );
                                    }
                                    return <span key={`text-${i}`}>{part}</span>;
                                })}
                            </>
                        );
                    }
                }
            },
        };

        return (
            <div className="prose prose-sm max-w-none leading-loose text-[#2D3142]">
                {parse(rawContent, options)}
            </div>
        );
    };

    const renderRadioSelect = () => {
        const isSelect = data.type === "select";
        return (
            <div className="space-y-6">
                {(data.list_of_questions || []).map((q, idx) => (
                    <div key={idx} className="rounded-lg border border-[#eadfba] bg-[#FAF7EB] p-4">
                        <div className="mb-3 flex items-start gap-2 font-semibold leading-6">
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-sm">
                                Q.{idx + 1}
                            </span>
                            <div className="min-w-0 flex-1 break-words prose prose-sm max-w-none">
                                {renderRichText(q.question, "[Empty Question Text]")}
                            </div>
                        </div>
                        <div className="pl-2">
                            {isSelect ? (
                                <div className="max-w-md rounded-lg border border-gray-200 bg-white p-3">
                                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Answer Options
                                    </div>
                                    <Select
                                        disabled
                                        placeholder="Select answer…"
                                        className="w-full"
                                        options={(q.options || []).map((opt: any, oIdx) => ({
                                            value: oIdx,
                                            label: opt.option_text || opt.content || opt.label || `[Option ${oIdx + 1}]`,
                                        }))}
                                    />
                                </div>
                            ) : (
                                <Radio.Group className="w-full">
                                    <div className="flex flex-col gap-2">
                                        {(q.options || []).map((opt: any, oIdx) => (
                                            <div
                                                key={oIdx}
                                                className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm"
                                            >
                                                <Radio
                                                    value={oIdx}
                                                    className="m-0 flex items-start"
                                                >
                                                    <div className="min-w-0 break-words prose prose-sm max-w-none">
                                                        {renderRichText(
                                                            opt.option_text || opt.content || opt.label,
                                                            `[Option ${oIdx + 1}]`
                                                        )}
                                                    </div>
                                                </Radio>
                                            </div>
                                        ))}
                                    </div>
                                </Radio.Group>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderCheckbox = () => {
        return (
            <div className="bg-[#FAF7EB] p-4 rounded-lg">
                <Checkbox.Group className="w-full">
                    <div className="space-y-3 flex flex-col">
                        {(data.list_of_options || []).map((opt: any, idx) => (
                            <Checkbox key={idx} value={idx}>
                                {opt.option_text || opt.option || opt.content || `[Option ${idx + 1}]`}
                            </Checkbox>
                        ))}
                    </div>
                </Checkbox.Group>
            </div>
        );
    };

    const renderMatching = () => {
        const mq = (data.matching_question || {}) as any;
        // Support both camelCase (admin format) and snake_case (database/legacy format)
        const matchingItems: any[] = mq.matchingItems || mq.matching_items || [];
        const answerOptions: any[] = mq.answerOptions || mq.answer_options || [];
        const layoutType: string = mq.layoutType || mq.layout_type;
        const summaryText: string = mq.summaryText || mq.summary_text;

        return (
            <div className="space-y-4">
                {layoutType === "summary" && summaryText && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h4 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Summary</h4>
                        <p className="text-sm leading-relaxed">{summaryText}</p>
                    </div>
                )}

                <div className="bg-white p-4 rounded border border-gray-200">
                    <h4 className="font-medium mb-2">Options Pool:</h4>
                    <div className="flex flex-wrap gap-2">
                        {answerOptions.map((opt: any, i: number) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {String.fromCharCode(65 + i)}. {opt.optionText || opt.option_text || `[Option ${i + 1}]`}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {matchingItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-center bg-[#FAF7EB] p-3 rounded">
                            <span className="bg-white px-2 rounded border font-medium text-sm">Q.{idx + 1}</span>
                            <span className="flex-1">{item.questionPart || item.question_part || `[Item ${idx + 1}]`}</span>
                            <Select
                                size="small"
                                className="w-24"
                                placeholder="Select"
                                options={answerOptions.map((_: any, i: number) => ({ value: i, label: String.fromCharCode(65 + i) }))}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMatrix = () => {
        const mq = (data.matrix_question || {}) as any;
        // Support both camelCase (admin format) and snake_case (database/legacy format)
        const matrixCategories: any[] = mq.matrixCategories || mq.matrix_categories || [];
        const matrixItems: any[] = mq.matrixItems || mq.matrix_items || [];

        const columns = [
            { title: "Question", dataIndex: "question", key: "question" },
            ...matrixCategories.map((cat: any) => {
                const letter = cat.categoryLetter || cat.category_letter || "";
                const text = cat.categoryText || cat.category_text || "";
                return {
                    title: letter || text,
                    dataIndex: letter,
                    key: letter,
                    render: () => <Radio disabled />,
                    align: "center" as const,
                };
            }),
        ];

        const tableData = matrixItems.map((item: any, i: number) => ({
            key: i,
            question: <span className="font-medium">Q.{i + 1} {item.itemText || item.item_text}</span>,
        }));

        return (
            <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    size="small"
                    bordered
                    className="w-full"
                />
            </div>
        );
    };

    return (
        <div className="text-left font-noto-sans text-[#2D3142]">
            {/* Title & Instructions */}
            <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">
                    {data.title || "Untitled Question"}
                </h3>
                {data.instructions && data.type !== "fillup" && (
                    <div className="prose prose-sm text-gray-600 italic">
                        {renderRichText(data.instructions)}
                    </div>
                )}
            </div>

            {/* Render proper type */}
            <div>
                {(data.type === "radio" || data.type === "select") && renderRadioSelect()}
                {data.type === "fillup" && renderFillup()}
                {data.type === "checkbox" && renderCheckbox()}
                {data.type === "matching" && renderMatching()}
                {data.type === "matrix" && renderMatrix()}
            </div>
        </div>
    );
}
