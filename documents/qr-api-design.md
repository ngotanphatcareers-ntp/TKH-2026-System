# TKH 2026 — QR KẾT ƯỚC API DESIGN

Version: 1.0  
Status: Approved Design  
Frontend implementation: Not Started  
Backend implementation: Not Started  

---

# 1. Mục tiêu

API QR Kết Ước cho phép:

- Học viên kiểm tra trạng thái Module.
- Học viên kiểm tra mình đã nhận Kết Ước hay chưa.
- Học viên gửi mã QR vừa quét để Backend xác nhận.
- Học viên xem lại Thẻ Kết Ước đã nhận.
- Admin bật, ẩn hoặc đóng Module.
- Admin xem thống kê và danh sách kết quả.
- Admin xem nội dung từng QR.
- Admin reset Kết Ước trong trường hợp đặc biệt.
- Admin tải dữ liệu phục vụ lưu trữ.

Nguyên tắc:

Frontend chỉ gửi yêu cầu.

Backend là nơi quyết định:

- Tài khoản có quyền hay không.
- Module có đang mở hay không.
- QR có hợp lệ hay không.
- Học viên đã quét trước đó hay chưa.
- Nội dung nào được lưu vào hồ sơ học viên.

# Xác định mùa hoạt động

Đối với API học viên:

- Frontend không gửi seasonId.
- Backend tự xác định mùa hiện tại.
- Backend kiểm tra học viên có Season Membership hợp lệ.
- Tất cả thao tác Scan và xem Card chỉ áp dụng trong mùa hiện tại.

Đối với API Admin:

- Nếu không truyền seasonId, Backend sử dụng mùa hiện tại.
- Trong tương lai Admin có thể truyền seasonId để xem dữ liệu lịch sử.

---

# 2. Base URL

Đề xuất:

```text
/api/covenants
```

Admin API đề xuất:

```text
/api/admin/covenants
```

Tất cả API sử dụng:

```text
Content-Type: application/json
```

---

# 3. Authentication và Authorization

Tất cả API yêu cầu Access Token hợp lệ.

Header:

```http
Authorization: Bearer <access_token>
```

Backend xác định người dùng từ Access Token.

Frontend không được gửi để Backend tin trực tiếp các trường:

```text
userId
memberId
seasonMembershipId
seasonId
role
groupId
```

Đối với học viên, Backend tự xác định:

```text
user
member
current season
season membership
group
```

Đối với Admin, Backend phải kiểm tra:

```text
role = ADMIN
```

trước khi thực hiện các API quản trị.

---

# 4. Trạng thái Module

Các trạng thái Module QR Kết Ước:

```text
DISABLED
ENABLED
CLOSED
```

## DISABLED

- Menu QR Kết Ước bị ẩn khỏi giao diện học viên.
- Học viên không được gọi API Scan.
- Admin vẫn xem và cấu hình được.

## ENABLED

- Menu QR Kết Ước được hiển thị.
- Học viên được phép Scan.
- Backend tiếp nhận QR hợp lệ.

## CLOSED

- Menu có thể vẫn hiển thị theo quyết định UI.
- Không tiếp nhận lượt Scan mới.
- Học viên đã có Covenant vẫn được xem lại Card.

---

# 5. API học viên

## 5.1 Kiểm tra trạng thái Module

```http
GET /api/covenants/module-status
```

### Response thành công

```json
{
  "success": true,
  "data": {
    "status": "ENABLED",
    "isMenuVisible": true,
    "canScan": true,
    "message": "Module QR Kết Ước đang mở."
  }
}
```

### Khi Module bị ẩn

```json
{
  "success": true,
  "data": {
    "status": "DISABLED",
    "isMenuVisible": false,
    "canScan": false,
    "message": "Module QR Kết Ước chưa được mở."
  }
}
```

---

## 5.2 Kiểm tra trạng thái Kết Ước của học viên

```http
GET /api/covenants/me
```

Backend kiểm tra học viên có Covenant ACTIVE trong mùa hiện tại hay chưa.

### Chưa có Covenant

```json
{
  "success": true,
  "data": {
    "hasCovenant": false,
    "canScan": true,
    "covenant": null
  }
}
```

### Đã có Covenant

```json
{
  "success": true,
  "data": {
    "hasCovenant": true,
    "canScan": false,
    "covenant": {
      "id": 125,
      "qrCode": "TKH2026-COV-03",
      "messageRendered": "Ngô Tấn Phát, ...",
      "bibleVerse": "Phi-líp 4:13",
      "receivedAt": "2026-07-20T08:30:00+07:00",
      "status": "ACTIVE",
      "isPinned": true
    }
  }
}
```

Không trả về:

```text
template nội bộ
đáp án kỹ thuật
memberId của người khác
dữ liệu mùa khác
```

---

## 5.3 Scan QR Kết Ước

```http
POST /api/covenants/scan
```

### Request

```json
{
  "qrCode": "TKH2026-COV-03"
}
```

Frontend chỉ gửi mã QR.

Frontend không gửi:

```text
memberName
messageRendered
bibleVerse
templateId
memberId
seasonId
```

### Quy trình Backend

Backend thực hiện theo đúng thứ tự:

1. Xác thực Access Token.
2. Xác định User.
3. Kiểm tra User có role STUDENT.
4. Xác định mùa hiện tại.
5. Kiểm tra Season Membership đang ACTIVE.
6. Kiểm tra Module có trạng thái ENABLED.
7. Chuẩn hóa `qrCode`.
8. Tìm QR Template thuộc mùa hiện tại.
9. Kiểm tra QR Template đang ACTIVE.
10. Kiểm tra học viên chưa có Covenant ACTIVE trong mùa hiện tại.
11. Render nội dung bằng cách thay:

```text
{{memberName}}
```

bằng tên chính thức của học viên.

12. Tạo `member_covenants`.
13. Lưu bản nội dung đã render.
14. Lưu câu gốc tại thời điểm Scan.
15. Commit transaction.
16. Trả về Covenant Card.

### Response thành công

```json
{
  "success": true,
  "message": "Bạn đã nhận Thẻ Kết Ước thành công.",
  "data": {
    "covenant": {
      "id": 125,
      "qrCode": "TKH2026-COV-03",
      "messageRendered": "Ngô Tấn Phát, ...",
      "bibleVerse": "Phi-líp 4:13",
      "receivedAt": "2026-07-20T08:30:00+07:00",
      "status": "ACTIVE",
      "isPinned": true
    }
  }
}
```

---

## 5.4 Xem lại Covenant Card

```http
GET /api/covenants/me/card
```

### Response

```json
{
  "success": true,
  "data": {
    "covenant": {
      "id": 125,
      "messageRendered": "Ngô Tấn Phát, ...",
      "bibleVerse": "Phi-líp 4:13",
      "receivedAt": "2026-07-20T08:30:00+07:00",
      "status": "ACTIVE",
      "isPinned": true
    }
  }
}
```

Nếu chưa có Covenant:

```json
{
  "success": false,
  "error": {
    "code": "COVENANT_NOT_FOUND",
    "message": "Bạn chưa nhận Thẻ Kết Ước."
  }
}
```

---

# 6. API Admin

## 6.1 Xem trạng thái Module

```http
GET /api/admin/covenants/settings
```

### Response

```json
{
  "success": true,
  "data": {
    "moduleStatus": "ENABLED",
    "currentSeason": {
      "id": 1,
      "code": "TKH2026",
      "name": "Thánh Kinh Hè 2026"
    },
    "updatedAt": "2026-07-20T07:00:00+07:00"
  }
}
```

---

## 6.2 Cập nhật trạng thái Module

```http
PATCH /api/admin/covenants/settings
```

### Request

```json
{
  "moduleStatus": "ENABLED"
}
```

Giá trị hợp lệ:

```text
DISABLED
ENABLED
CLOSED
```

### Quy trình

1. Xác thực Admin.
2. Kiểm tra trạng thái hợp lệ.
3. Xác định mùa hiện tại hoặc mùa được Admin chọn.
4. Cập nhật `season_settings`.
5. Tạo Audit Log.
6. Trả về trạng thái mới.

### Response

```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái Module QR Kết Ước.",
  "data": {
    "moduleStatus": "ENABLED"
  }
}
```

---

## 6.3 Danh sách QR Template

```http
GET /api/admin/covenants/templates
```

Query Parameters:

```text
seasonId
status
search
page
limit
```

Ví dụ:

```http
GET /api/admin/covenants/templates?status=ACTIVE&page=1&limit=20
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 3,
        "qrCode": "TKH2026-COV-03",
        "messageTemplate": "{{memberName}}, ...",
        "bibleVerse": "Phi-líp 4:13",
        "isActive": true,
        "receivedCount": 37
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 5,
      "totalPages": 1
    }
  }
}
```

---

## 6.4 Tạo QR Template

```http
POST /api/admin/covenants/templates
```

### Request

```json
{
  "qrCode": "TKH2026-COV-05",
  "messageTemplate": "{{memberName}}, nội dung lời khích lệ...",
  "bibleVerse": "Giê-rê-mi 29:11",
  "isActive": true
}
```

### Validation

- `qrCode` không được trống.
- `qrCode` phải duy nhất trong mùa.
- `messageTemplate` không được trống.
- `messageTemplate` nên có `{{memberName}}`.
- `bibleVerse` không được trống.
- Chỉ Admin được tạo.

### Response

```json
{
  "success": true,
  "message": "Đã tạo QR Template.",
  "data": {
    "templateId": 5
  }
}
```

---

## 6.5 Cập nhật QR Template

```http
PATCH /api/admin/covenants/templates/:templateId
```

### Request

```json
{
  "messageTemplate": "{{memberName}}, nội dung mới...",
  "bibleVerse": "Ê-sai 41:10",
  "isActive": true
}
```

Quy tắc quan trọng:

- Việc sửa Template không được thay đổi Covenant Card đã phát hành.
- `member_covenants.message_rendered` và `bible_verse` đã lưu phải giữ nguyên.
- Thay đổi chỉ áp dụng cho lượt Scan sau.

---

## 6.6 Xem thống kê

```http
GET /api/admin/covenants/statistics
```

Query Parameters:

```text
seasonId
```

### Response

```json
{
  "success": true,
  "data": {
    "totalMembers": 180,
    "receivedCount": 142,
    "notReceivedCount": 38,
    "completionPercent": 78.9,
    "activeCovenants": 142,
    "resetCount": 3,
    "byTemplate": [
      {
        "templateId": 1,
        "qrCode": "TKH2026-COV-01",
        "receivedCount": 31
      }
    ]
  }
}
```

---

## 6.7 Danh sách kết quả Kết Ước

```http
GET /api/admin/covenants/results
```

Query Parameters:

```text
seasonId
search
groupId
templateId
status
page
limit
sortBy
sortOrder
```

Ví dụ:

```http
GET /api/admin/covenants/results?groupId=2&status=ACTIVE&page=1&limit=50
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "covenantId": 125,
        "memberCode": "TKH002",
        "fullName": "Ngô Tấn Phát",
        "groupName": "Ti-mô-thê",
        "qrCode": "TKH2026-COV-03",
        "bibleVerse": "Phi-líp 4:13",
        "receivedAt": "2026-07-20T08:30:00+07:00",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalItems": 142,
      "totalPages": 3
    }
  }
}
```

---

## 6.8 Xem chi tiết một Covenant

```http
GET /api/admin/covenants/results/:covenantId
```

### Response

```json
{
  "success": true,
  "data": {
    "covenant": {
      "id": 125,
      "memberCode": "TKH002",
      "fullName": "Ngô Tấn Phát",
      "groupName": "Ti-mô-thê",
      "qrCode": "TKH2026-COV-03",
      "messageRendered": "Ngô Tấn Phát, ...",
      "bibleVerse": "Phi-líp 4:13",
      "receivedAt": "2026-07-20T08:30:00+07:00",
      "status": "ACTIVE"
    }
  }
}
```

---

## 6.9 Reset Covenant

```http
POST /api/admin/covenants/results/:covenantId/reset
```

### Request

```json
{
  "reason": "Học viên quét nhầm QR do lỗi kỹ thuật."
}
```

### Quy tắc

- Chỉ Admin được Reset.
- `reason` bắt buộc.
- Không xóa record cũ.
- Covenant cũ chuyển sang trạng thái RESET.
- Ghi `reset_at`.
- Ghi `reset_by`.
- Tạo record trong `covenant_reset_logs`.
- Tạo Audit Log.
- Học viên được phép Scan lại sau khi reset thành công.

### Response

```json
{
  "success": true,
  "message": "Đã reset Kết Ước cho học viên."
}
```

---

## 6.10 Export dữ liệu

```http
GET /api/admin/covenants/export
```

Query Parameters:

```text
seasonId
groupId
templateId
status
format
```

`format` đề xuất:

```text
xlsx
csv
```

Mặc định:

```text
xlsx
```

File Excel đề xuất gồm:

### Sheet 1 — Kết quả

- Mã TKH.
- Họ tên.
- Nhóm.
- QR Code.
- Nội dung đã render.
- Câu gốc.
- Thời gian nhận.
- Trạng thái.

### Sheet 2 — Chưa nhận

- Mã TKH.
- Họ tên.
- Nhóm.
- Trạng thái.

### Sheet 3 — Reset Log

- Mã TKH.
- Họ tên.
- Covenant cũ.
- Admin reset.
- Lý do.
- Thời gian reset.

Tên file:

```text
TKH2026_QR_Covenant_YYYYMMDD_HHmm.xlsx
```

---

# 7. Error Response chuẩn

Mọi lỗi API trả về dạng:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo dễ hiểu.",
    "details": null
  }
}
```

---

# 8. Error Code đề xuất

## Authentication

```text
UNAUTHORIZED
TOKEN_EXPIRED
FORBIDDEN
```

## Season

```text
CURRENT_SEASON_NOT_FOUND
SEASON_MEMBERSHIP_NOT_FOUND
SEASON_NOT_ACTIVE
```

## Module

```text
COVENANT_MODULE_DISABLED
COVENANT_MODULE_CLOSED
```

## QR

```text
QR_CODE_REQUIRED
QR_CODE_INVALID
QR_TEMPLATE_NOT_FOUND
QR_TEMPLATE_INACTIVE
QR_CODE_DUPLICATED
```

## Covenant

```text
COVENANT_ALREADY_RECEIVED
COVENANT_NOT_FOUND
COVENANT_ALREADY_RESET
RESET_REASON_REQUIRED
```

## Validation

```text
VALIDATION_ERROR
INVALID_STATUS
```

## System

```text
DATABASE_ERROR
INTERNAL_SERVER_ERROR
```

---

# 9. HTTP Status Code

Đề xuất:

| Trường hợp | HTTP Status |
|---|---:|
| Thành công | 200 |
| Tạo mới thành công | 201 |
| Request không hợp lệ | 400 |
| Chưa đăng nhập | 401 |
| Không đủ quyền | 403 |
| Không tìm thấy | 404 |
| Xung đột nghiệp vụ | 409 |
| Validation không đạt | 422 |
| Lỗi hệ thống | 500 |

Ví dụ học viên đã có Covenant:

```text
409 Conflict
COVENANT_ALREADY_RECEIVED
```

---

# 10. Transaction và chống quét trùng

API Scan bắt buộc sử dụng Database Transaction.

Quy trình đề xuất:

```text
BEGIN TRANSACTION

Lock/check Covenant ACTIVE của member trong season hiện tại

Nếu đã tồn tại:
    ROLLBACK
    trả COVENANT_ALREADY_RECEIVED

Nếu chưa tồn tại:
    INSERT member_covenants

COMMIT
```

Không chỉ dựa vào kiểm tra ở Frontend.

Database phải có ràng buộc hoặc chiến lược đảm bảo một học viên không thể tạo hai Covenant ACTIVE trong cùng mùa do:

- Bấm hai lần.
- Mở hai tab.
- Gửi request đồng thời.
- Mạng retry.
- Quét lại cực nhanh.

---

# 11. Idempotency

Có thể hỗ trợ header:

```http
Idempotency-Key: <uuid>
```

cho API Scan.

Nếu cùng một request được gửi lại do lỗi mạng:

- Backend không tạo thêm Covenant.
- Backend trả lại kết quả của request trước.

Trong phiên bản đầu, ràng buộc database và transaction là bắt buộc.

Idempotency Key là khuyến nghị tăng cường.

---

# 12. Chuẩn hóa QR Code

Trước khi tìm kiếm, Backend nên:

- Trim khoảng trắng.
- Không chấp nhận chuỗi rỗng.
- Kiểm tra độ dài tối đa.
- Không thực thi nội dung QR như code.
- Chỉ dùng giá trị QR để đối chiếu database.

Không nên để QR chứa trực tiếp:

```text
message
memberId
templateId có thể sửa
URL admin
secret
```

QR nên chứa mã không nhạy cảm, ví dụ:

```text
TKH2026-COV-03
```

Hoặc URL chính thức:

```text
https://tkh-domain.example/covenant/scan?code=TKH2026-COV-03
```

Dù dùng URL, Backend vẫn phải xác thực toàn bộ nghiệp vụ.

---

# 13. Bảo mật

- Không tin `memberName` từ Frontend.
- Không tin `seasonId` từ học viên.
- Không cho học viên xem QR Template khác.
- Không cho học viên xem Covenant của người khác.
- Không trả password hoặc password hash.
- Admin endpoint phải kiểm tra role.
- Rate limit API Scan.
- Ghi log các lần Scan thất bại bất thường nếu cần.
- Escape nội dung khi render HTML.
- Không lưu Access Token vào URL.
- Không dùng QR Code như khóa bảo mật duy nhất.

---

# 14. Rate Limiting

Đề xuất cho API Scan:

```text
Tối đa 10 request/phút/user
```

Có thể bổ sung:

```text
Tối đa 30 request/phút/IP
```

Khi vượt giới hạn:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
  }
}
```

HTTP Status:

```text
429 Too Many Requests
```

---

# 15. Audit Log

Các hành động bắt buộc ghi Audit Log:

- Admin bật Module.
- Admin đóng Module.
- Admin ẩn Module.
- Admin tạo QR Template.
- Admin sửa QR Template.
- Admin bật/tắt QR Template.
- Admin reset Covenant.
- Admin export dữ liệu nếu BTC cần theo dõi.

Audit gồm:

```text
season_id
admin_user_id
action
entity_type
entity_id
old_value
new_value
reason
ip_address
created_at
```

---

# 16. Dữ liệu lịch sử

Không xóa Covenant cũ khi:

- Template bị sửa.
- Template bị tắt.
- Module bị đóng.
- Admin reset.
- Chuyển sang mùa mới.

Card đã phát hành giữ nguyên:

```text
message_rendered
bible_verse
qr_code
received_at
```

Điều này giúp đối chiếu đúng nội dung học viên đã nhận tại thời điểm Scan.

---

# 17. Logging và Monitoring

Backend nên ghi log:

- Request ID.
- User ID.
- Season ID.
- Endpoint.
- Kết quả.
- Error Code.
- Thời gian xử lý.

Không ghi vào log:

- Access Token.
- Password.
- Password Hash.
- Nội dung nhạy cảm không cần thiết.

---

# 18. OpenAPI

Khi bắt đầu Backend, nên tạo tài liệu:

```text
OpenAPI 3.0
```

cho các endpoint QR Kết Ước.

Mục tiêu:

- Frontend và Backend dùng cùng contract.
- Langdock hoặc AI khác có thể generate code chính xác hơn.
- Dễ test bằng Swagger UI hoặc Postman.
- Tránh sai tên field.

---

# 19. Phạm vi phiên bản đầu

Phiên bản TKH 2026 bắt buộc có:

- Module Status.
- Kiểm tra Covenant của bản thân.
- Scan QR.
- Xem Card.
- Admin bật, đóng hoặc ẩn Module.
- Admin xem thống kê.
- Admin xem danh sách.
- Admin xem chi tiết.
- Admin reset có lý do.
- Export Excel.
- Transaction chống Scan trùng.
- Audit Log.
- Multi-season.

Chưa ưu tiên:

- Chia sẻ Card ra mạng xã hội.
- Tự tạo ảnh Card.
- Push notification.
- Scan QR ngoại tuyến.
- Nhiều Covenant ACTIVE trong cùng mùa.
- Chuyển Covenant giữa học viên.