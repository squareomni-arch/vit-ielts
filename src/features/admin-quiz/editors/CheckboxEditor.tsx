import { useState } from "react";
import { Input, Checkbox, Button, Popover } from "antd";
import { DeleteOutlined, CommentOutlined } from "@ant-design/icons";

type CheckboxOption = {
  option_text: string;
  correct: boolean;
  explanation?: string;
};

type CheckboxEditorProps = {
  options: CheckboxOption[];
  onChange: (v: CheckboxOption[]) => void;
};

export default function CheckboxEditor({
  options,
  onChange,
}: CheckboxEditorProps) {
  const [openExpIdx, setOpenExpIdx] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<CheckboxOption>) => {
    const arr = [...options];
    arr[idx] = { ...arr[idx], ...patch };
    onChange(arr);
  };

  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  const correctCount = options.filter((o) => o.correct).length;

  return (
    <div className="space-y-2">
      {correctCount > 0 && (
        <p className="text-xs text-blue-600 mb-1">
          ✓ <strong>{correctCount}</strong> đáp án đúng được chọn
        </p>
      )}

      {(Array.isArray(options) ? options : []).map((o, idx) => (
        <div key={idx} className="flex items-center gap-2" style={{ minWidth: 0 }}>
          {/* Letter label */}
          <div
            style={{
              background: o.correct ? "#dcfce7" : "#f3f4f6",
              border: o.correct ? "1px solid #86efac" : "1px solid #e5e7eb",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              minWidth: 28,
              textAlign: "center",
              flexShrink: 0,
              color: o.correct ? "#15803d" : "#6b7280",
              transition: "all 0.15s",
            }}
          >
            {String.fromCharCode(65 + idx)}
          </div>

          <Checkbox
            style={{ flexShrink: 0 }}
            checked={o.correct}
            onChange={(e) => update(idx, { correct: e.target.checked })}
          />
          <Input
            value={(o as { option_text?: string; option?: string }).option_text ?? (o as { option?: string }).option ?? ""}
            onChange={(e) => update(idx, { option_text: e.target.value })}
            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Popover
            open={openExpIdx === idx}
            onOpenChange={(v) => setOpenExpIdx(v ? idx : null)}
            trigger="click"
            title="Giải thích cho option này"
            content={
              <Input.TextArea
                rows={3}
                style={{ width: 280 }}
                placeholder="Nhập giải thích…"
                value={o.explanation ?? ""}
                onChange={(e) => update(idx, { explanation: e.target.value })}
              />
            }
          >
            <Button
              size="small"
              icon={<CommentOutlined />}
              type={o.explanation ? "primary" : "default"}
              title="Add explanation"
              style={{ flexShrink: 0 }}
            />
          </Popover>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(idx)}
            style={{ flexShrink: 0 }}
          />
        </div>
      ))}

      <Button
        size="small"
        className="mt-1"
        onClick={() =>
          onChange([...options, { option_text: "", correct: false }])
        }
      >
        + Add Option
      </Button>
    </div>
  );
}
