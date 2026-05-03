import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Row, Col } from "antd";
import type { PassageData } from "./types";
import RichTextEditor from "./RichTextEditor";
import { DEFAULT_PASSAGE } from "./constants";
import MMSSInput from "./MMSSInput";

type PassageModalProps = {
    open: boolean;
    initialData?: PassageData;
    skill: string;
    onCancel: () => void;
    onSave: (data: PassageData) => void;
};

export default function PassageModal({ open, initialData, skill, onCancel, onSave }: PassageModalProps) {
    const [form] = Form.useForm<PassageData>();
    const [content, setContent] = useState("");

    useEffect(() => {
        if (open) {
            const data = initialData || { ...DEFAULT_PASSAGE };
            form.setFieldsValue(data);
            setContent(data.content || "");
        } else {
            form.resetFields();
            setContent("");
        }
    }, [open, initialData, form]);

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                onSave({
                    ...(initialData || DEFAULT_PASSAGE),
                    ...values,
                    content,
                });
            })
            .catch((info) => {
                console.log("Validate Failed:", info);
            });
    };

    const isListening = skill === "listening";

    return (
        <Modal
            title={initialData ? "Edit Passage" : "Add Passage"}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={800}
            destroyOnClose
            centered
            okText="Save Passage"
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Row gutter={16}>
                    <Col span={isListening ? 12 : 16}>
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[{ required: true, message: "Please input passage title!" }]}
                        >
                            <Input placeholder="Reading Passage 1..." />
                        </Form.Item>
                    </Col>
                    {isListening && (
                        <>
                            <Col span={3}>
                                <Form.Item
                                    name="audio_start"
                                    label="Audio Start"
                                    tooltip="MM:SS hoặc số giây"
                                >
                                    <MMSSInput placeholder="0:40" />
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Form.Item
                                    name="audio_end"
                                    label="Audio End"
                                    tooltip="MM:SS hoặc số giây"
                                >
                                    <MMSSInput placeholder="4:15" />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                    <Col span={isListening ? 6 : 8}>
                        <Form.Item name="start_question_number" label="Start question no">
                            <InputNumber placeholder="Mặc định: 1" min={1} className="w-full" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Content" required>
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Nhập nội dung bài đọc..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
