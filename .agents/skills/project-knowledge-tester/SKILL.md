---
name: project-knowledge-tester
description: >-
  Sử dụng skill này khi người dùng yêu cầu kiểm tra dự án, nhắc lại các quy tắc code,
  hoặc chạy các bài test tự động cho phần mềm Quản lý Nguyên liệu.
---

# Kỹ năng Quản lý Kiến thức và Tự động Test

Khi được gọi, hãy tuân thủ các quy tắc trong phần kiến thức và thực hiện quy trình test theo các bước sau.

## 1. Kiến thức Nghiệp vụ và Code (Knowledge Base)
- **Cơ sở dữ liệu**: Thông tin cấu hình và quy tắc DB xem chi tiết tại [database-rules.md](./references/database-rules.md).
- **Quy tắc Code chung**:
  - Luôn sử dụng tiếng Việt có dấu cho các thông báo lỗi hiển thị cho người dùng.
  - Các hàm kết nối Database cần được đóng (Close) hoặc nằm trong khối `using` để giải phóng tài nguyên.
  - (Thêm các quy tắc riêng của bạn vào đây...)

## 2. Quy trình Tự động Test (Auto Testing Workflow)
Khi có yêu cầu test chức năng, hãy làm theo các bước:

1. Đọc và hiểu kỹ đoạn code/chức năng người dùng muốn test.
2. Nếu có script test tự động, hãy chạy nó (AI sẽ dùng công cụ dòng lệnh để chạy):
   Ví dụ chạy file powershell: [run-tests.ps1](./scripts/run-tests.ps1).
3. Nếu phải test thủ công bằng cách review code, hãy đối chiếu với các quy tắc ở mục 1.
4. Tổng hợp các lỗi tìm thấy (nếu có) và đưa ra gợi ý sửa lỗi (fix code).

## 3. Tiêu chí Báo cáo (Reporting)
- [Tên chức năng test]
- Kết quả: PASS / FAIL / WARNING
- Chi tiết: Liệt kê rõ ràng những gì đã kiểm tra và kết quả tương ứng.
