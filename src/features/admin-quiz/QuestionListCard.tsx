import { useEffect, useMemo, useState } from "react";
import { Card, Button, Select, Empty, Popconfirm, Tooltip } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined, HolderOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { PassageData, QuestionData } from "./types";
import QuestionModal from "./QuestionModal";

type QuestionListCardProps = {
    passages: PassageData[];
    onAddQuestion: (pIdx: number, data: QuestionData) => void;
    onUpdateQuestion: (pIdx: number, qIdx: number, data: QuestionData) => void;
    onRemoveQuestion: (pIdx: number, qIdx: number) => void;
    onReorderQuestions: (pIdx: number, oldIndex: number, newIndex: number) => void;
};

function QuestionItem({
    question,
    index,
    onEdit,
    onRemove,
}: {
    question: QuestionData;
    index: number;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const sortableId = question.id || `q-${index}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="py-4 border-b border-dashed border-gray-200 last:border-b-0 first:pt-0 last:pb-0">
            <div className="flex justify-between items-center">
                <div className="w-1/2 flex items-center gap-4">
                    <span {...listeners} className="cursor-grab text-gray-400 hover:text-primary-500 p-1">
                        <HolderOutlined />
                    </span>
                    <div className="w-8 h-8 shrink-0 bg-gray-100 rounded flex items-center justify-center">
                        <CopyOutlined className="text-gray-500" />
                    </div>
                    <div className="leading-none space-y-1">
                        <h3 className="font-semibold text-base leading-none text-gray-800">
                            {question.title || `Question ${index + 1}`}
                        </h3>
                    </div>
                </div>
                <div className="w-1/2 flex items-center justify-end space-x-2">
                    <Tooltip title="Edit">
                        <Button type="primary" onClick={onEdit} icon={<EditOutlined />} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this question?"
                        onConfirm={onRemove}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                    <Button {...listeners} icon={<MoreOutlined />} className="cursor-grab" />
                </div>
            </div>
        </div>
    );
}

export default function QuestionListCard({
    passages,
    onAddQuestion,
    onUpdateQuestion,
    onRemoveQuestion,
    onReorderQuestions,
}: QuestionListCardProps) {
    const [currentPassage, setCurrentPassage] = useState<number>(-1);
    const [editIndex, setEditIndex] = useState(-1);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (passages.length > 0 && currentPassage === -1) {
            setCurrentPassage(passages.length - 1);
        } else if (currentPassage !== -1 && !passages[currentPassage]) {
            setCurrentPassage(Math.max(0, currentPassage - 1));
        } else if (passages.length === 0) {
            setCurrentPassage(-1);
        }
    }, [passages, currentPassage]);

    const activeQuestions = currentPassage >= 0 && passages[currentPassage] ? passages[currentPassage].questions || [] : [];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const items = useMemo(() => activeQuestions.map((q, idx) => q.id || `q-${idx}`), [activeQuestions]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || currentPassage === -1) return;
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
            onReorderQuestions(currentPassage, oldIndex, newIndex);
        }
    };

    return (
        <>
            {modalOpen && currentPassage !== -1 && (
                <QuestionModal
                    open={modalOpen}
                    initialData={editIndex >= 0 ? activeQuestions[editIndex] : undefined}
                    onCancel={() => { setModalOpen(false); setEditIndex(-1); }}
                    onSave={(data) => {
                        if (editIndex === -1) {
                            onAddQuestion(currentPassage, data);
                        } else {
                            onUpdateQuestion(currentPassage, editIndex, data);
                        }
                        setModalOpen(false);
                        setEditIndex(-1);
                    }}
                />
            )}

            <Card
                title={<h3 className="text-lg m-0">List of Questions</h3>}
                extra={
                    <div className="flex items-center space-x-2">
                        {passages.length > 0 && (
                            <>
                                <Select
                                    value={currentPassage !== -1 ? currentPassage : undefined}
                                    onChange={(val) => setCurrentPassage(val)}
                                    style={{ width: 200 }}
                                    placeholder="Select a passage"
                                >
                                    {passages.map((p, idx) => (
                                        <Select.Option key={idx} value={idx}>
                                            {p.title || `Passage ${idx + 1}`}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button
                                    type="primary"
                                    onClick={() => { setEditIndex(-1); setModalOpen(true); }}
                                    icon={<PlusOutlined />}
                                    disabled={currentPassage === -1}
                                >
                                    Add Question
                                </Button>
                            </>
                        )}
                    </div>
                }
                className="mb-8"
            >
                <div className="flex flex-col">
                    {passages.length === 0 ? (
                        <Empty description="No passages found. Please add a passage first." />
                    ) : activeQuestions.length === 0 ? (
                        <Empty description="No questions found in this passage">
                            <Button onClick={() => { setEditIndex(-1); setModalOpen(true); }} icon={<PlusOutlined />}>
                                Add Question
                            </Button>
                        </Empty>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToFirstScrollableAncestor]}
                        >
                            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                {activeQuestions.map((q, idx) => (
                                    <QuestionItem
                                        key={q.id || `q-${idx}`}
                                        question={q}
                                        index={idx}
                                        onEdit={() => { setEditIndex(idx); setModalOpen(true); }}
                                        onRemove={() => onRemoveQuestion(currentPassage, idx)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </Card>
        </>
    );
}
