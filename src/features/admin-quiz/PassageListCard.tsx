import { useMemo, useState } from "react";
import { Card, Button, Popconfirm, Empty, Tooltip, Badge } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined, HolderOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { PassageData } from "./types";
import PassageModal from "./PassageModal";

type PassageListCardProps = {
    passages: PassageData[];
    skill: string;
    onAdd: (data: PassageData) => void;
    onUpdate: (pIdx: number, data: PassageData) => void;
    onRemove: (pIdx: number) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
};

function PassageItem({
    passage,
    index,
    onEdit,
    onRemove,
}: {
    passage: PassageData;
    index: number;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const sortableId = passage.id || `p-${index}`;
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
                    {/* Placeholder cho Icon giống legacy */}
                    <div className="w-8 h-8 shrink-0 bg-gray-100 rounded flex items-center justify-center">
                        <CopyOutlined className="text-gray-500" />
                    </div>
                    <div className="leading-none space-y-1">
                        <h3 className="font-semibold text-base leading-none text-gray-800">
                            {passage.title || `Passage ${index + 1}`}
                        </h3>
                    </div>
                </div>
                <div className="w-1/2 flex items-center justify-end space-x-2">
                    <Tooltip title="Edit">
                        <Button type="primary" onClick={onEdit} icon={<EditOutlined />} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this passage?"
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

export default function PassageListCard({ passages, skill, onAdd, onUpdate, onRemove, onReorder }: PassageListCardProps) {
    const [editIndex, setEditIndex] = useState(-1);
    const [modalOpen, setModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const items = useMemo(() => passages.map((p, idx) => p.id || `p-${idx}`), [passages]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
            onReorder(oldIndex, newIndex);
        }
    };

    return (
        <>
            {modalOpen && (
                <PassageModal
                    open={modalOpen}
                    skill={skill}
                    initialData={editIndex >= 0 ? passages[editIndex] : undefined}
                    onCancel={() => { setModalOpen(false); setEditIndex(-1); }}
                    onSave={(data) => {
                        if (editIndex === -1) {
                            onAdd(data);
                        } else {
                            onUpdate(editIndex, data);
                        }
                        setModalOpen(false);
                        setEditIndex(-1);
                    }}
                />
            )}

            <Card
                title={<h3 className="text-lg m-0">List of Passages</h3>}
                extra={
                    <Button type="primary" onClick={() => { setEditIndex(-1); setModalOpen(true); }} icon={<PlusOutlined />}>
                        Add Passage
                    </Button>
                }
                className="mb-4"
            >
                <div className="flex flex-col">
                    {passages.length === 0 ? (
                        <Empty description="No passages found" />
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToFirstScrollableAncestor]}
                        >
                            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                {passages.map((passage, idx) => (
                                    <PassageItem
                                        key={passage.id || `p-${idx}`}
                                        passage={passage}
                                        index={idx}
                                        onEdit={() => { setEditIndex(idx); setModalOpen(true); }}
                                        onRemove={() => onRemove(idx)}
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
