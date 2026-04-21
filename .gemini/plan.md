### 📋 Plan — PM Scope & Max Project Limit

**Mục tiêu:** 
1. MANAGER chỉ xem nhân viên trong dự án mình quản lý (qua PRJ_VIEW), không xem toàn bộ nhân viên công ty.
2. Giảm giới hạn tham gia dự án tối đa từ 3 → 2.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm | Tình trạng |
|---|---|---|---|
| 1 | `V35__revoke_emp_view_all_from_manager.sql` | Flyway migration gỡ EMP_VIEW_ALL khỏi MANAGER | ✅ Xong |
| 2 | `ProjectService.java` | Đổi MAX_CURRENT_PROJECTS_PER_EMPLOYEE từ 3 → 2 | ✅ Xong |
| 3 | `employees/[id]/page.tsx` | Đổi hiển thị "/3 dự án" → "/2 dự án", slice(0,3) → slice(0,2) | ✅ Xong |

**Verify bằng cách:**
- Đăng nhập MANAGER → trang Nhân viên redirect về profile cá nhân ✅
- Đăng nhập MANAGER → trang Dự án → xem chi tiết dự án + thành viên bình thường
- Thêm nhân viên vào 3 dự án → lỗi "tối đa 2 dự án"

✅ Đã hoàn thành toàn bộ.