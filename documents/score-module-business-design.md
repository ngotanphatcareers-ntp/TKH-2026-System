
# TKH 2026 – Score Module Business Design (FROZEN)

## Các quyết định đã thống nhất

### 1. Cấu trúc điểm

| Nhóm điểm | Điểm thô tối đa | Quy đổi |
|---|---:|---:|
| Chuyên cần |110|30|
| Học tập |200|40|
| Rèn luyện |90|30|

Điểm tổng kết = Chuyên cần quy đổi + Học tập quy đổi + Rèn luyện quy đổi.

Các hạng mục chưa phát sinh được tính là 0 ngay từ đầu chương trình.

---

## 2. Chuyên cần

Nguồn điểm:

- Điểm danh tự động.
- Điều chỉnh điểm danh thủ công bởi Admin.

Điểm chuyên cần hợp lệ luôn nằm trong khoảng:

0 → 110.

Điều chỉnh điểm danh dùng khi:
- GPS lỗi.
- Khiếu nại hợp lệ.
- Cộng hoặc trừ để sửa sai.

---

## 3. Học tập

Bao gồm:

- Pre-test (3 bài)
- Bible Challenge / Kiểm tra bài cũ
- Phát biểu
- Final Test

Điểm học tập tối đa: 200.

### Pre-test

- Có 3 bài Pre-test trong toàn chương trình.
- Mỗi tuần tổ chức 1 bài.
- Mỗi bài gồm 10 câu hỏi.
- Mỗi câu trả lời đúng được 1 điểm.
- Điểm tối đa mỗi bài: 10.
- Tổng điểm tối đa của 3 bài: 30.

### Final Test

- Có 1 bài Final Test cuối chương trình.
- Gồm 30 câu hỏi.
- Mỗi câu trả lời đúng được 2 điểm.
- Điểm tối đa: 60.

### Phát biểu

- +2 mỗi lần.
- Đúng hoặc sai đều được cộng.
- Có thể nhập điểm âm để sửa sai.
- Không thấp hơn 0.
- Không vượt quá 50.

### Bible Challenge

- Random 4 nhóm mỗi buổi.
- Không lặp nhóm trong cùng một vòng.
- Reset chỉ reset vòng random.

Nếu trả lời đúng:

→ toàn bộ thành viên của nhóm được chọn nhận +10.

Nếu trả lời sai:

→ nhóm được chọn không nhận điểm.

→ toàn bộ các nhóm còn lại nhận +10.

Điểm Bible Challenge của mỗi thành viên:

0 → 60.

Thành viên thêm sau:

- Không hồi tố điểm cũ.
- Chỉ nhận giao dịch phát sinh sau khi được thêm.

---

## 4. Rèn luyện

Ba hạng mục:

- Trực nhật
- Tuân thủ
- Tinh thần

Mỗi hạng mục:

0 → 30.

Tổng tối đa:

90.

Admin chấm một lần cuối kỳ.

Có thể sửa lại điểm sau khi chấm.

Sửa là cập nhật giá trị chính thức, không cộng dồn.

---

## 5. Thành viên và nhóm

- Không chuyển nhóm.
- Chỉ thêm thành viên mới.
- Thành viên mới không nhận giao dịch nhóm trước thời điểm được thêm.

Điểm nhóm:

= Trung bình điểm tổng kết của toàn bộ thành viên đã import thuộc nhóm.

Người chưa có điểm vẫn được tính với điểm 0.

---

## 6. Hiển thị

Điểm:

- Hiển thị 2 chữ số thập phân.

Ranking:

- Dùng giá trị chính xác trước khi làm tròn.

Học viên:

- Chỉ thấy Top 10 cá nhân.
- Chỉ thấy Top 3 nhóm.
- Không thấy điểm của người khác.
- Không thấy điểm của nhóm khác.

Admin:

- Thấy toàn bộ điểm và lịch sử.

---

## 7. Giao diện Admin Score

### Tab Cộng điểm cá nhân

Loại điểm chỉ còn:

- Phát biểu
- Điều chỉnh điểm danh

Không còn:

- Khác
- Điểm thưởng
- Chọn nhóm điểm

Lý do:

- Không bắt buộc.

### Bible Challenge

Không cộng điểm từ Admin Score.

Điểm được tạo ngay trong màn Bible Challenge.

### Rèn luyện

Có màn riêng cuối kỳ gồm:

- Trực nhật
- Tuân thủ
- Tinh thần

---

## 8. Quy tắc Backend

Backend luôn giới hạn:

- Chuyên cần: 0–110
- Phát biểu: 0–50
- Bible Challenge: 0–60
- Rèn luyện: 0–90

Không cho phép vượt trần.

Mọi giao dịch đều lưu lịch sử và audit.

---

## 9. Trạng thái

Tài liệu này được xem là FROZEN và là nguồn nghiệp vụ chính thức cho Module Score của TKH 2026.
