import { useCallback, useMemo, useState } from "react";
import { Button, Tag, Popconfirm, Badge, Tooltip } from "antd";
import {
    PlusOutlined, DeleteOutlined, HolderOutlined,
    QuestionCircleOutlined, DownOutlined, RightOutlined,
    EditOutlined,
} from "@ant-design/icons";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { QuestionData } from "./types";
import QuestionEditor from "./QuestionEditor";

type QuestionListProps = {
    questions: QuestionData[];
    onAdd: () => void;
    onRemove: (qIdx: number) => void;
    onUpdate: (qIdx: number, field: string, value: unknown) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
};

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    radio: { color: "#1890ff", icon: "◉", label: "Radio" },
    select: { color: "#13c2c2", icon: "▾", label: "Select" },
    fillup: { color: "#52c41a", icon: "⬚", label: "Fill-up" },
    checkbox: { color: "#fa8c16", icon: "☑", label: "Checkbox" },
    matching: { color: "#722ed1", icon: "⇄", label: "Matching" },
    matrix: { color: "#eb2f96", icon: "▦", label: "Matrix" },
};

// ---------------------------------------------------------------------------
// Get a short preview text from question data
// ---------------------------------------------------------------------------
function getQuestionPreview(q: QuestionData): string {
    if (q.title) return q.title;
    if (q.question_text) {
        // Strip HTML tags for preview
        const text = q.question_text.replace(/<[^>]*>/g, "").trim();
        return text.length > 60 ? text.slice(0, 60) + "…" : text;
    }
    return "(Chưa có nội dung)";
}

// ---------------------------------------------------------------------------
// Count sub-items for summary badge
// ---------------------------------------------------------------------------
function getSubItemCount(q: QuestionData): number {
    if (q.type === "radio" || q.type === "select") return q.list_of_questions?.length || 0;
    if (q.type === "fillup") return q.explanations?.length || 0;
    if (q.type === "checkbox") return q.list_of_options?.length || 0;
    if (q.type === "matching") return q.matching_question?.matchingItems?.length || 0;
    if (q.type === "matrix") return q.matrix_question?.matrixItems?.length || 0;
    return 0;
}

function SortableQuestionCard({
    question,
    qIdx,
    isExpanded,
    onToggle,
    onRemove,
    onUpdate,
}: {
    question: QuestionData;
    qIdx: number;
    isExpanded: boolean;
    onToggle: () => void;
    onRemove: () => void;
    onUpdate: (field: string, value: unknown) => void;
}) {
    const sortableId = question.id || `q-${qIdx}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
    const config = TYPE_CONFIG[question.type] || { color: "#8c8c8c", icon: "?", label: question.type };
    const subItemCount = getSubItemCount(question);
    const preview = getQuestionPreview(question);

    const transformStr = CSS.Transform.toString(transform);
    const style: React.CSSProperties = {
        transform: isDragging
            ? `${transformStr} scale(1.02)`
            : transformStr,
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className={`question-card ${isExpanded ? "question-card--expanded" : ""}`}>
                {/* Color stripe on the left */}
                <div
                    className="question-card-stripe"
                    style={{ backgroundColor: config.color }}
                />

                <div className="question-card-inner">
                    {/* Header — always visible, clickable to toggle */}
                    <div
                        className="question-card-header"
                        onClick={onToggle}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
                    >
                        <div className="question-card-header-left">
                            <span
                                {...listeners}
                                className="question-drag-handle"
                                title="Kéo để sắp xếp"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <HolderOutlined />
                            </span>

                            <span className="question-expand-icon">
                                {isExpanded ? <DownOutlined /> : <RightOutlined />}
                            </span>

                            <span className="question-card-number">
                                Q{qIdx + 1}
                            </span>

                            <Tag
                                color={config.color}
                                style={{
                                    borderRadius: 4,
                                    fontWeight: 500,
                                    fontSize: 11,
                                    lineHeight: '20px',
                                }}
                            >
                                {config.icon} {config.label}
                            </Tag>

                            {/* Collapsed: show preview text */}
                            {!isExpanded && (
                                <span className="question-card-preview">
                                    {preview}
                                </span>
                            )}
                        </div>

                        <div className="question-card-header-right" onClick={(e) => e.stopPropagation()}>
                            {subItemCount > 0 && (
                                <Tooltip title={`${subItemCount} mục con`}>
                                    <Badge
                                        count={subItemCount}
                                        style={{
                                            backgroundColor: '#f0f0f0',
                                            color: '#666',
                                            fontSize: 11,
                                            boxShadow: 'none',
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {!isExpanded && (
                                <Tooltip title="Chỉnh sửa">
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        type="text"
                                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    />
                                </Tooltip>
                            )}
                            <Popconfirm
                                title="Xóa câu hỏi này?"
                                description={`Câu hỏi Q${qIdx + 1} sẽ bị xóa vĩnh viễn.`}
                                onConfirm={onRemove}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    type="text"
                                />
                            </Popconfirm>
                        </div>
                    </div>

                    {/* Body — only visible when expanded */}
                    {isExpanded && (
                        <div className="question-card-body">
                            <QuestionEditor question={question} onUpdate={onUpdate} />
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .question-card {
                    display: flex;
                    border: 1px solid #e8e8e8;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    overflow: hidden;
                    background: #fff;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
                }

                .question-card:hover {
                    border-color: #d9d9d9;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                }

                .question-card--expanded {
                    border-color: #91caff;
                    box-shadow: 0 2px 8px rgba(24,144,255,0.12);
                }

                .question-card-stripe {
                    width: 4px;
                    flex-shrink: 0;
                }

                .question-card-inner {
                    flex: 1;
                    min-width: 0;
                }

                .question-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    background: #fafafa;
                    gap: 8px;
                    cursor: pointer;
                    user-select: none;
                    transition: background 0.15s;
                }

                .question-card-header:hover {
                    background: #f0f5ff;
                }

                .question-card--expanded .question-card-header {
                    border-bottom: 1px solid #f0f0f0;
                    background: #e6f4ff;
                }

                .question-card-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    flex: 1;
                }

                .question-card-header-right {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-shrink: 0;
                }

                .question-drag-handle {
                    cursor: grab;
                    color: #ccc;
                    font-size: 14px;
                    padding: 2px 4px;
                    border-radius: 4px;
                    transition: all 0.15s;
                    display: flex;
                    align-items: center;
                }

                .question-drag-handle:hover {
                    color: #1890ff;
                    background: #e6f7ff;
                }

                .question-expand-icon {
                    font-size: 10px;
                    color: #999;
                    display: flex;
                    align-items: center;
                    transition: color 0.15s;
                }

                .question-card--expanded .question-expand-icon {
                    color: #1890ff;
                }

                .question-card-number {
                    font-weight: 700;
                    font-size: 13px;
                    color: #333;
                    min-width: 28px;
                }

                .question-card-preview {
                    font-size: 13px;
                    color: #888;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 400px;
                }

                .question-card-body {
                    padding: 16px 14px;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

export default function QuestionList({ questions, onAdd, onRemove, onUpdate, onReorder }: QuestionListProps) {
    // Accordion state: only one question expanded at a time
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const safeQuestions = Array.isArray(questions) ? questions : [];

    const sortableIds = useMemo(
        () => safeQuestions.map((q, idx) => q.id || `q-${idx}`),
        [safeQuestions],
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortableIds.indexOf(String(active.id));
        const newIndex = sortableIds.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
            onReorder(oldIndex, newIndex);
        }
    };

    const toggleQuestion = useCallback((key: string) => {
        setExpandedKey(prev => prev === key ? null : key);
    }, []);

    // Add question and auto-expand it
    const handleAddQuestion = useCallback(() => {
        onAdd();
        // After adding, expand the new question (it will be at the end)
        const newKey = `q-${safeQuestions.length}`;
        setExpandedKey(newKey);
    }, [onAdd, safeQuestions.length]);

    return (
        <div>
            {/* Add question bar */}
            <div className="question-list-add-bar">
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddQuestion}
                    block
                    className="question-add-btn"
                >
                    Thêm câu hỏi
                </Button>
            </div>

            {safeQuestions.length === 0 ? (
                <div className="question-list-empty">
                    <QuestionCircleOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                    <p style={{ color: '#999', margin: 0 }}>
                        Chưa có câu hỏi nào. Nhấn nút bên trên để thêm.
                    </p>
                </div>
            ) : (
                <>
                    {/* Collapse/expand all helper */}
                    <div className="question-list-toolbar">
                        <span className="question-list-count">
                            {safeQuestions.length} câu hỏi
                        </span>
                        {expandedKey && (
                            <Button
                                size="small"
                                type="link"
                                onClick={() => setExpandedKey(null)}
                            >
                                Thu gọn tất cả
                            </Button>
                        )}
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                            {safeQuestions.map((q, qIdx) => {
                                const key = q.id || `q-${qIdx}`;
                                return (
                                    <SortableQuestionCard
                                        key={key}
                                        question={q}
                                        qIdx={qIdx}
                                        isExpanded={expandedKey === key}
                                        onToggle={() => toggleQuestion(key)}
                                        onRemove={() => onRemove(qIdx)}
                                        onUpdate={(field, value) => onUpdate(qIdx, field, value)}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </>
            )}

            <style jsx>{`
                .question-list-add-bar {
                    margin-bottom: 12px;
                }

                .question-list-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 0 2px;
                }

                .question-list-count {
                    font-size: 12px;
                    color: #999;
                    font-weight: 500;
                }

                .question-list-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background: #fafafa;
                    border: 1px dashed #e8e8e8;
                    border-radius: 8px;
                }
            `}</style>

            <style jsx global>{`
                .question-add-btn {
                    height: 44px !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    border-radius: 8px !important;
                    border-color: #1890ff !important;
                    color: #1890ff !important;
                }

                .question-add-btn:hover {
                    border-color: #40a9ff !important;
                    color: #40a9ff !important;
                    background: #e6f7ff !important;
                }
            `}</style>
        </div>
    );
}
