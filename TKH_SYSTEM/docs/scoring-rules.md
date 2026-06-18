# TKH 2026 - Quy tắc tính điểm

## 1. Mục tiêu

Quy tắc tính điểm dùng để quản lý điểm cá nhân, điểm nhóm và kết quả thi đua trong chương trình TKH.

## 2. Nguyên tắc chung

- Mỗi điểm cộng/trừ phải có lý do rõ ràng.
- Điểm cá nhân được lưu theo từng thành viên.
- Điểm nhóm được tính từ tổng điểm cá nhân của các thành viên trong nhóm.
- Admin/Teacher có quyền cộng hoặc trừ điểm thủ công khi cần.
- Các điểm phát sinh từ điểm danh và Bible Challenge sẽ được hệ thống tự tạo sau này.

## 3. Các loại điểm dự kiến

| Loại điểm | Mã hệ thống | Điểm | Ghi chú |
|---|---|---:|---|
| Điểm danh hợp lệ | attendance | +5 | Khi thành viên điểm danh thành công |
| Trả bài cũ | bible_challenge | +10 | Khi được random và trả lời đạt |
| Trò chơi nhóm | game | +10 đến +50 | Tùy hoạt động |
| Thuộc câu gốc | memory_verse | +10 | Khi thuộc câu gốc |
| Đi trễ | late | -2 | Nếu BTC muốn áp dụng |
| Vắng học | absent | 0 hoặc -5 | Cần chốt quy định |
| Cộng/trừ thủ công | manual | tùy chỉnh | Admin nhập lý do |

## 4. Điểm cá nhân

Điểm cá nhân được tính bằng:

```text
Tổng điểm cá nhân = Tổng tất cả score_value của thành viên