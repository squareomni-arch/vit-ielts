import { Alert } from "antd";

/**
 * Cảnh báo hiển thị ở đầu các trang CMS Admin đã "mồ côi" sau khi đổi giao diện:
 * frontend mới hardcode nội dung và KHÔNG còn đọc config của section này nữa,
 * nên mọi chỉnh sửa lưu ở đây sẽ không hiển thị trên website.
 *
 * Dùng để tránh admin nhầm tưởng section vẫn còn tác dụng. Khi frontend được
 * nối lại config (wire-up), xoá component này khỏi trang tương ứng.
 */
export function InactiveSectionNotice({ note }: { note?: string }) {
  return (
    <Alert
      type="warning"
      showIcon
      style={{ maxWidth: 900, margin: "0 auto 16px" }}
      message="Mục này hiện KHÔNG hiển thị trên giao diện mới"
      description={
        note ??
        "Giao diện mới đang hiển thị nội dung cố định và không đọc cấu hình của mục này. Chỉnh sửa và lưu ở đây sẽ không thay đổi gì trên website."
      }
    />
  );
}

export default InactiveSectionNotice;
