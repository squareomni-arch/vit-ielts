import { Radio, Checkbox, Input, Select, Table, Collapse } from "antd";
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

    // ── Fillup ────────────────────────────────────────────────────────────────
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
                                        const answer = part.slice(1, -1).trim();
                                        return (
                                            <Input
                                                key={`fillup-${i}`}
                                                size="small"
                                                addonBefore={`Q.${qNum}`}
                                                className="w-fit inline-block mx-1 align-middle"
                                                placeholder={answer || "..."}
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
            <div className="space-y-4">
                <div className="prose prose-sm max-w-none leading-loose text-[#2D3142]">
                    {parse(rawContent, options)}
                </div>
                {data.explanations?.[0]?.content && (
                    <ExplanationBlock
                        content={data.explanations[0].content}
                        renderRichText={renderRichText}
                    />
                )}
            </div>
        );
    };

    // ── Radio / Select ────────────────────────────────────────────────────────
    const renderRadioSelect = () => {
        const isSelect = data.type === "select";
        return (
            <div className="space-y-6">
                {(data.list_of_questions || []).map((q, idx) => {
                    const correctIdx =
                        typeof q.correct === "number"
                            ? q.correct
                            : parseInt(String(q.correct), 10);
                    return (
                        <div key={idx} className="rounded-lg border border-[#eadfba] bg-[#FAF7EB] p-4">
                            {/* Question stem */}
                            <div className="mb-3 flex items-start gap-2 font-semibold leading-6">
                                <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-sm">
                                    Q.{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1 break-words prose prose-sm max-w-none">
                                    {renderRichText(q.question, "[Empty Question Text]")}
                                </div>
                            </div>

                            {/* Options */}
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
                                                label:
                                                    opt.option_text ||
                                                    opt.content ||
                                                    opt.label ||
                                                    `[Option ${oIdx + 1}]`,
                                            }))}
                                        />
                                        {!isNaN(correctIdx) && q.options?.[correctIdx] && (
                                            <CorrectAnswerBadge
                                                label={
                                                    (q.options[correctIdx] as any).option_text ||
                                                    `Option ${correctIdx + 1}`
                                                }
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {(q.options || []).map((opt: any, oIdx) => {
                                            const isCorrect = oIdx === correctIdx;
                                            return (
                                                <div
                                                    key={oIdx}
                                                    className={`rounded-lg border px-3 py-2 shadow-sm transition-colors ${
                                                        isCorrect
                                                            ? "border-green-400 bg-green-50"
                                                            : "border-white bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Radio
                                                            value={oIdx}
                                                            checked={isCorrect}
                                                            disabled
                                                            className="m-0 mt-0.5"
                                                        />
                                                        <div className="min-w-0 break-words prose prose-sm max-w-none flex-1">
                                                            {renderRichText(
                                                                opt.option_text || opt.content || opt.label,
                                                                `[Option ${oIdx + 1}]`
                                                            )}
                                                        </div>
                                                        {isCorrect && (
                                                            <span className="ml-auto shrink-0 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                                ✓ Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Per-question explanation */}
                            {q.explanation && (
                                <ExplanationBlock content={q.explanation} renderRichText={renderRichText} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Checkbox ──────────────────────────────────────────────────────────────
    const renderCheckbox = () => {
        return (
            <div className="bg-[#FAF7EB] p-4 rounded-lg space-y-3">
                {(data.list_of_options || []).map((opt: any, idx) => {
                    const isCorrect = opt.correct === true;
                    return (
                        <div key={idx}>
                            <div
                                className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
                                    isCorrect
                                        ? "bg-green-50 border border-green-300"
                                        : "bg-white border border-transparent"
                                }`}
                            >
                                <Checkbox checked={isCorrect} disabled className="mt-0.5" />
                                <span className="flex-1 text-sm">
                                    {opt.option_text || opt.option || opt.content || `[Option ${idx + 1}]`}
                                </span>
                                {isCorrect && (
                                    <span className="shrink-0 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                        ✓ Correct
                                    </span>
                                )}
                            </div>
                            {opt.explanation && (
                                <ExplanationBlock content={opt.explanation} renderRichText={renderRichText} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Matching ──────────────────────────────────────────────────────────────
    const renderMatching = () => {
        const mq = (data.matching_question || {}) as any;
        const matchingItems: any[] = mq.matchingItems || mq.matching_items || [];
        const answerOptions: any[] = mq.answerOptions || mq.answer_options || [];
        const layoutType: string = mq.layoutType || mq.layout_type;
        const summaryText: string = mq.summaryText || mq.summary_text;

        return (
            <div className="space-y-4">
                {layoutType === "summary" && summaryText && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h4 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">
                            Summary
                        </h4>
                        <p className="text-sm leading-relaxed">{summaryText}</p>
                    </div>
                )}

                <div className="bg-white p-4 rounded border border-gray-200">
                    <h4 className="font-medium mb-2">Options Pool:</h4>
                    <div className="flex flex-wrap gap-2">
                        {answerOptions.map((opt: any, i: number) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {String.fromCharCode(65 + i)}.{" "}
                                {opt.optionText || opt.option_text || `[Option ${i + 1}]`}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {matchingItems.map((item: any, idx: number) => {
                        const correctAnswer = item.correctAnswer || item.correct_answer || "";
                        return (
                            <div key={idx}>
                                <div className="flex gap-3 items-center bg-[#FAF7EB] p-3 rounded">
                                    <span className="bg-white px-2 rounded border font-medium text-sm">
                                        Q.{idx + 1}
                                    </span>
                                    <span className="flex-1">
                                        {item.questionPart || item.question_part || `[Item ${idx + 1}]`}
                                    </span>
                                    {correctAnswer ? (
                                        <span className="shrink-0 bg-green-100 border border-green-400 text-green-700 font-bold px-3 py-1 rounded text-sm">
                                            {correctAnswer}
                                        </span>
                                    ) : (
                                        <Select
                                            size="small"
                                            className="w-24"
                                            placeholder="Select"
                                            options={answerOptions.map((_: any, i: number) => ({
                                                value: i,
                                                label: String.fromCharCode(65 + i),
                                            }))}
                                        />
                                    )}
                                </div>
                                {item.explanation && (
                                    <ExplanationBlock
                                        content={item.explanation}
                                        renderRichText={renderRichText}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ── Matrix ────────────────────────────────────────────────────────────────
    const renderMatrix = () => {
        const mq = (data.matrix_question || {}) as any;
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
                    render: (_: any, record: any) => {
                        const isCorrect = record.correctLetter === letter;
                        return <Radio disabled checked={isCorrect} />;
                    },
                    align: "center" as const,
                };
            }),
        ];

        const tableData = matrixItems.map((item: any, i: number) => ({
            key: i,
            question: (
                <div>
                    <span className="font-medium">
                        Q.{i + 1} {item.itemText || item.item_text}
                    </span>
                    {item.explanation && (
                        <ExplanationBlock
                            content={item.explanation}
                            renderRichText={renderRichText}
                        />
                    )}
                </div>
            ),
            correctLetter: item.correctCategoryLetter || item.correct_category_letter || "",
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

    // ── Root render ───────────────────────────────────────────────────────────
    return (
        <div className="text-left font-noto-sans text-[#2D3142]">
            {/* Title & Instructions */}
            <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">{data.title || "Untitled Question"}</h3>
                {data.instructions && data.type !== "fillup" && (
                    <div className="prose prose-sm text-gray-600 italic">
                        {renderRichText(data.instructions)}
                    </div>
                )}
            </div>

            {/* Type-specific renderer */}
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

// ─── Helper sub-components ────────────────────────────────────────────────────

function CorrectAnswerBadge({ label }: { label: string }) {
    return (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 border border-green-300 px-3 py-2">
            <span className="text-green-600 font-bold text-sm">✓ Correct:</span>
            <span className="text-sm text-green-800">{label}</span>
        </div>
    );
}

function ExplanationBlock({
    content,
    renderRichText,
}: {
    content: string;
    renderRichText: (v?: string, fallback?: string) => ReturnType<typeof parse> | null;
}) {
    if (!content?.trim()) return null;
    return (
        <div className="mt-2">
            <Collapse
                ghost
                size="small"
                className="bg-amber-50/50 border border-amber-200 rounded-md overflow-hidden"
                items={[
                    {
                        key: "1",
                        label: (
                            <span className="font-semibold text-amber-900 flex items-center gap-1 text-xs">
                                💡 Explanation
                            </span>
                        ),
                        children: (
                            <div className="text-sm text-amber-900 py-1">
                                <span className="prose prose-sm max-w-none inline">
                                    {renderRichText(content)}
                                </span>
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
}
