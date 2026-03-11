import { Input, Space, Button, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

type MatrixData = {
    matrixCategories: { categoryLetter: string; categoryText: string }[];
    matrixItems: { itemText: string; correctCategoryLetter: string }[];
    layoutType?: string;
    legendTitle?: string;
};

type MatrixEditorProps = {
    data: MatrixData;
    onChange: (v: MatrixData) => void;
};

export default function MatrixEditor({ data, onChange }: MatrixEditorProps) {
    const update = (field: string, value: unknown) => onChange({ ...data, [field]: value });

    return (
        <div className="bg-gray-50 p-3 rounded">
            <Divider orientation="left">Matrix</Divider>
            <Divider orientation="left" plain>Categories</Divider>
            {(data.matrixCategories ?? []).map((cat, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder="Letter (A, B, C...)" value={cat.categoryLetter} onChange={(e) => { const arr = [...data.matrixCategories]; arr[idx] = { ...arr[idx], categoryLetter: e.target.value }; update("matrixCategories", arr); }} style={{ width: 120 }} />
                    <Input placeholder="Category text" value={cat.categoryText} onChange={(e) => { const arr = [...data.matrixCategories]; arr[idx] = { ...arr[idx], categoryText: e.target.value }; update("matrixCategories", arr); }} style={{ width: 300 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matrixCategories", data.matrixCategories.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matrixCategories", [...(data.matrixCategories ?? []), { categoryLetter: "", categoryText: "" }])}>Thêm category</Button>

            <Divider orientation="left" plain>Items</Divider>
            {(data.matrixItems ?? []).map((item, idx) => (
                <Space key={idx} className="mb-1 w-full">
                    <Input placeholder="Item text" value={item.itemText} onChange={(e) => { const arr = [...data.matrixItems]; arr[idx] = { ...arr[idx], itemText: e.target.value }; update("matrixItems", arr); }} style={{ width: 300 }} />
                    <Input placeholder="Correct letter" value={item.correctCategoryLetter} onChange={(e) => { const arr = [...data.matrixItems]; arr[idx] = { ...arr[idx], correctCategoryLetter: e.target.value }; update("matrixItems", arr); }} style={{ width: 120 }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update("matrixItems", data.matrixItems.filter((_, i) => i !== idx))} />
                </Space>
            ))}
            <Button icon={<PlusOutlined />} onClick={() => update("matrixItems", [...(data.matrixItems ?? []), { itemText: "", correctCategoryLetter: "" }])}>Thêm item</Button>
        </div>
    );
}
