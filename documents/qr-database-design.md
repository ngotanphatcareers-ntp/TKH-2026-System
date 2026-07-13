# TKH 2026 — QR KẾT ƯỚC DATABASE DESIGN

Version: 1.0  
Status: Approved Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

Module QR Kết Ước cần lưu trữ:

- Danh sách 5 QR của BTC.
- Nội dung từng QR.
- Lịch sử học viên đã nhận QR.
- Trạng thái hoạt động của Module.
- Lịch sử Reset.
- Audit Log.

Nguyên tắc:

Một học viên chỉ có **01 Kết Ước đang hoạt động**.

Nếu Reset thì:

- Không xóa dữ liệu cũ.
- Chỉ đánh dấu hết hiệu lực.
- Cho phép tạo bản ghi mới.

---

# 2. Các bảng cần có

Module này sử dụng các bảng:

1. qr_templates
2. member_covenants
3. covenant_reset_logs
4. system_settings

---

# 3. Bảng qr_templates

Lưu 5 QR của BTC.

Các cột:

| Field | Type | Description |
|--------|------|-------------|
| id | INT PK | ID |
| qr_code | VARCHAR(20) | QR01 |
| title | VARCHAR(100) | Tên QR |
| message_template | TEXT | Nội dung có {{memberName}} |
| bible_verse | TEXT | Câu gốc |
| is_active | BOOLEAN | QR đang sử dụng |
| created_at | DATETIME | Ngày tạo |
| updated_at | DATETIME | Ngày sửa |
| season_id | INT FK | Mùa TKH sở hữu QR |
---

Ví dụ

QR01

Message:

"{{memberName}}, hãy mạnh mẽ..."

Bible Verse

"Giô-suê 1:9"

---

# 4. Bảng member_covenants

Đây là bảng quan trọng nhất.

Mỗi lần học viên nhận QR sẽ sinh một bản ghi.

Các cột

| Field | Type |
|--------|------|
| id | INT PK |
| member_id | INT FK |
| template_id | INT FK |
| qr_code | VARCHAR(20) |
| message_rendered | TEXT |
| bible_verse | TEXT |
| received_at | DATETIME |
| status | ENUM |
| reset_reason | TEXT |
| reset_at | DATETIME |
| reset_by | INT |
| created_at | DATETIME |
| season_id | INT FK | Mùa TKH |

---

Giải thích

status

ACTIVE

Đang sử dụng

RESET

Đã reset

EXPIRED

Có thể dùng cho các mùa sau.

---

message_rendered

Không lưu

{{memberName}}

Mà lưu luôn

"Ngô Tấn Phát,
hãy mạnh mẽ..."

để sau này nếu đổi Template vẫn giữ nguyên.

---

Quy tắc

Một member chỉ có

01 record ACTIVE.

---

# 5. Bảng covenant_reset_logs

Lưu toàn bộ lịch sử Reset.

Các cột

| Field | Type |
|--------|------|
| id | INT PK |
| covenant_id | INT FK |
| member_id | INT FK |
| admin_id | INT FK |
| reason | TEXT |
| reset_time | DATETIME |
| season_id | INT FK | Mùa TKH |

Không sửa.

Không xóa.

Chỉ Insert.

---

# 6. system_settings

Module QR chỉ cần thêm một setting.

Ví dụ

| Key | Value |
|-----|-------|
| covenant_module_status | ENABLED |

Giá trị

DISABLED

Menu ẩn

ENABLED

Cho quét

CLOSED

Không cho quét

---

# 7. Quan hệ

qr_templates

↓

member_covenants

↓

covenant_reset_logs

member

↓

member_covenants

admin

↓

covenant_reset_logs

---

# 8. Quy tắc dữ liệu

## Template

Không xóa.

Có thể chỉnh.

Nếu chỉnh thì:

Không ảnh hưởng học viên đã nhận.

---

## Member Covenant

Không Update message_rendered.

Không Update bible_verse.

Chỉ đổi Status.

---

## Reset

Không Delete.

Không sửa.

Luôn Insert Log.

---

# 9. Luồng dữ liệu

## Bước 1

BTC tạo QR01

↓

qr_templates

---

## Bước 2

Học viên quét QR01

↓

Backend đọc Template

↓

Thay

{{memberName}}

↓

Sinh message_rendered

↓

Insert member_covenants

↓

Status ACTIVE

---

## Bước 3

Admin xem

↓

member_covenants

---

## Bước 4

Admin Reset

↓

ACTIVE

↓

RESET

↓

Insert covenant_reset_logs

↓

Học viên được quét lại

---

# 10. Chỉ mục (Index)

Đề xuất

member_id

status

qr_code

received_at

template_id

để tăng tốc tìm kiếm.

---

# 11. Ràng buộc

Một member

chỉ có

01 ACTIVE Covenant.

Nếu Backend phát hiện

đã tồn tại ACTIVE

thì trả về lỗi

409 Conflict

Message

"Học viên đã nhận Kết Ước."

---

# 12. Audit

Các thao tác cần lưu

- Ai tạo QR
- Ai sửa QR
- Ai bật Module
- Ai tắt Module
- Ai Reset
- Thời gian Reset
- Lý do Reset

Không cho phép mất lịch sử.

---

# 13. Khả năng mở rộng

Thiết kế này hỗ trợ:

- TKH 2027
- TKH 2028
- TKH 2029

Trong tương lai chỉ cần thêm

season_id

vào:

qr_templates

member_covenants

là có thể quản lý nhiều mùa Thánh Kinh Hè.

Không cần sửa cấu trúc chính.
 mới:
# 13. Hỗ trợ Multi-season

Module QR Kết Ước sử dụng `season_id` ngay từ thiết kế chính thức.

Các bảng cần có `season_id`:

- qr_templates
- member_covenants
- covenant_reset_logs

Quy tắc:

Một học viên chỉ có 01 Kết Ước ACTIVE trong mỗi mùa.

Ràng buộc nghiệp vụ:

season_id + member_id + status ACTIVE

Điều này cho phép cùng một thành viên:

- Nhận Kết Ước trong TKH 2026.
- Tiếp tục nhận Kết Ước mới trong TKH 2027.
- Giữ nguyên lịch sử Kết Ước của các mùa trước.