import { useMemo } from "react";
import { Collapse, Space, Button, Popconfirm, Badge, Tag, Empty, Tooltip } from "antd";
import {
    PlusOutlined, DeleteOutlined, HolderOutlined,
    FileTextOutlined,
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
import type { PassageData } from "./types";
import PassageEditor from "./PassageEditor";

const { Panel } = Collapse;

type PassageListProps = {
    passages: PassageData[];
    skill: string;
    onAdd: () => void;
    onRemove: (pIdx: number) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
    onUpdatePassage: (pIdx: number, field: string, value: unknown) => void;
    onAddQuestion: (pIdx: number) => void;
    onRemoveQuestion: (pIdx: number, qIdx: number) => void;
    onUpdateQuestion: (pIdx: number, qIdx: number, field: string, value: unknown) => void;
    onReorderQuestions: (pIdx: number, oldIndex: number, newIndex: number) => void;
};

function SortablePassagePanel({
    passage,
    pIdx,
    totalPassages,
    skill,
    onRemove,
    onUpdatePassage,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onReorderQuestions,
}: {
    passage: PassageData;
    pIdx: number;
    totalPassages: number;
    skill: string;
    onRemove: () => void;
    onUpdatePassage: (field: string, value: unknown) => void;
    onAddQuestion: () => void;
    onRemoveQuestion: (qIdx: number) => void;
    onUpdateQuestion: (qIdx: number, field: string, value: unknown) => void;
    onReorderQuestions: (oldIndex: number, newIndex: number) => void;
}) {
    const sortableId = passage.id || `p-${pIdx}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
    const qCount = Array.isArray(passage.questions) ? passage.questions.length : 0;

    // Get unique question types in this passage
    const questionTypes = useMemo(() => {
        if (!Array.isArray(passage.questions)) return [];
        const types = new Set(passage.questions.map(q => q.type));
        return Array.from(types);
    }, [passage.questions]);

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const typeColors: Record<string, string> = {
        radio: "#1890ff", select: "#13c2c2", fillup: "#52c41a",
        checkbox: "#fa8c16", matching: "#722ed1", matrix: "#eb2f96",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="passage-panel-wrapper">
                <Collapse
                    className="passage-collapse"
                    items={[{
                        key: sortableId,
                        label: (
                            <div className="passage-header">
                                <span
                                    {...listeners}
                                    className="passage-drag-handle"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <HolderOutlined />
                                </span>
                                <div className="passage-header-info">
                                    <div className="passage-header-title">
                                        <span className="passage-number">
                                            Passage {pIdx + 1}
                                        </span>
                                        <span className="passage-name">
                                            {passage.title || "(Chưa đặt tên)"}
                                        </span>
                                    </div>
                                    <div className="passage-header-badges">
                                        <Badge
                                            count={qCount}
                                            showZero
                                            style={{
                                                backgroundColor: qCount > 0 ? '#1890ff' : '#d9d9d9',
                                                fontSize: 11,
                                            }}
                                        />
                                        <span className="passage-header-badge-label">câu hỏi</span>
                                        {questionTypes.length > 0 && (
                                            <div className="passage-type-dots">
                                                {questionTypes.map(t => (
                                                    <Tooltip key={t} title={t}>
                                                        <span
                                                            className="passage-type-dot"
                                                            style={{ backgroundColor: typeColors[t] || '#8c8c8c' }}
                                                        />
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                        extra: (
                            <Space onClick={(e) => e.stopPropagation()} size={4}>
                                {totalPassages > 1 && (
                                    <Popconfirm
                                        title="Xóa passage này?"
                                        description={`Passage "${passage.title || pIdx + 1}" và ${qCount} câu hỏi sẽ bị xóa.`}
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
                                )}
                            </Space>
                        ),
                        children: (
                            <PassageEditor
                                passage={passage}
                                skill={skill}
                                pIdx={pIdx}
                                onUpdatePassage={onUpdatePassage}
                                onAddQuestion={onAddQuestion}
                                onRemoveQuestion={onRemoveQuestion}
                                onUpdateQuestion={onUpdateQuestion}
                                onReorderQuestions={onReorderQuestions}
                            />
                        ),
                    }]}
                />
            </div>

            <style jsx>{`
                .passage-panel-wrapper {
                    margin-bottom: 10px;
                }

                .passage-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }

                .passage-drag-handle {
                    cursor: grab;
                    color: #bbb;
                    font-size: 16px;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.15s;
                    display: flex;
                    align-items: center;
                }

                .passage-drag-handle:hover {
                    color: #1890ff;
                    background: #e6f7ff;
                }

                .passage-header-info {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex: 1;
                    min-width: 0;
                    gap: 12px;
                }

                .passage-header-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }

                .passage-number {
                    font-weight: 600;
                    color: #1890ff;
                    font-size: 13px;
                    white-space: nowrap;
                    background: #e6f7ff;
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .passage-name {
                    font-size: 14px;
                    color: var(--admin-text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .passage-header-badges {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-shrink: 0;
                }

                .passage-header-badge-label {
                    font-size: 12px;
                    color: #999;
                }

                .passage-type-dots {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    margin-left: 4px;
                }

                .passage-type-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }
            `}</style>
        </div>
    );
}

export default function PassageList({
    passages,
    skill,
    onAdd,
    onRemove,
    onReorder,
    onUpdatePassage,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onReorderQuestions,
}: PassageListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = useMemo(
        () => passages.map((p, idx) => p.id || `p-${idx}`),
        [passages],
    );

    const totalQuestions = useMemo(
        () => passages.reduce((sum, p) => sum + (Array.isArray(p.questions) ? p.questions.length : 0), 0),
        [passages],
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

    return (
        <div className="passage-list-container">
            {/* Header */}
            <div className="passage-list-header">
                <div className="passage-list-header-left">
                    <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                    <span className="passage-list-title">
                        Passages
                        <Tag style={{ marginLeft: 8 }}>{passages.length}</Tag>
                    </span>
                    <span className="passage-list-subtitle">
                        · {totalQuestions} câu hỏi
                    </span>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                >
                    Thêm Passage
                </Button>
            </div>

            {/* Passage list */}
            {passages.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có passage nào"
                >
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                        Thêm Passage đầu tiên
                    </Button>
                </Empty>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        {passages.map((passage, pIdx) => (
                            <SortablePassagePanel
                                key={passage.id || `p-${pIdx}`}
                                passage={passage}
                                pIdx={pIdx}
                                totalPassages={passages.length}
                                skill={skill}
                                onRemove={() => onRemove(pIdx)}
                                onUpdatePassage={(field, value) => onUpdatePassage(pIdx, field, value)}
                                onAddQuestion={() => onAddQuestion(pIdx)}
                                onRemoveQuestion={(qIdx) => onRemoveQuestion(pIdx, qIdx)}
                                onUpdateQuestion={(qIdx, field, value) => onUpdateQuestion(pIdx, qIdx, field, value)}
                                onReorderQuestions={(oldIndex, newIndex) => onReorderQuestions(pIdx, oldIndex, newIndex)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}

            <style jsx>{`
                .passage-list-container {
                    border: 1px solid var(--admin-border);
                    border-radius: 8px;
                    background: var(--admin-surface);
                    overflow: hidden;
                }

                .passage-list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 20px;
                    border-bottom: 1px solid var(--admin-border);
                    background: var(--admin-surface-hover);
                }

                .passage-list-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .passage-list-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--admin-text-primary);
                }

                .passage-list-subtitle {
                    font-size: 13px;
                    color: #999;
                }
            `}</style>

            <style jsx global>{`
                .passage-collapse {
                    border: none !important;
                    background: transparent !important;
                    border-radius: 0 !important;
                }

                .passage-collapse .ant-collapse-item {
                    border: none !important;
                    border-bottom: 1px solid var(--admin-border) !important;
                    border-radius: 0 !important;
                }

                .passage-collapse .ant-collapse-item:last-child {
                    border-bottom: none !important;
                }

                .passage-collapse .ant-collapse-header {
                    padding: 12px 20px !important;
                    align-items: center !important;
                    background: var(--admin-surface) !important;
                    transition: background 0.15s !important;
                }

                .passage-collapse .ant-collapse-header:hover {
                    background: var(--admin-surface-hover) !important;
                }

                .passage-collapse .ant-collapse-content {
                    border-top: 1px solid var(--admin-border) !important;
                }

                .passage-collapse .ant-collapse-content-box {
                    padding: 20px !important;
                    background: var(--admin-surface-hover) !important;
                }
            `}</style>
        </div>
    );
}
