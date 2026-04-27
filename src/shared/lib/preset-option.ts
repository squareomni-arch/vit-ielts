/**
 * Force uppercase cho option text khi câu hỏi thuộc preset True/False/Not Given
 * hoặc Yes/No/Not Given. Dữ liệu cũ trong DB lưu dạng "True"/"Not Given" nên phải
 * normalize ở display layer; preset options mới (xem features/admin-quiz/constants)
 * đã lưu uppercase sẵn nên hàm này idempotent.
 */
export const PRESET_UPPERCASE_FORMS = new Set<string>([
    "true_false_not_given",
    "yes_no_not_given",
]);

export function isPresetUppercaseForm(
    form: string | string[] | null | undefined,
): boolean {
    const f = Array.isArray(form) ? form[0] : form;
    return typeof f === "string" && PRESET_UPPERCASE_FORMS.has(f);
}

export function formatPresetOptionText(
    text: string | null | undefined,
    form: string | string[] | null | undefined,
): string {
    const t = String(text ?? "");
    return isPresetUppercaseForm(form) ? t.toUpperCase() : t;
}
