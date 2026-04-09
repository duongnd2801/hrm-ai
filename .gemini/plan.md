# Plan — Redesign Permission UI (Read-Only) + Giữ CRUD Role

**Mục tiêu:** Đổi trang Permission từ CRUD sang read-only catalog; admin chỉ gán permission vào role qua ma trận phân quyền.

## Các bước thực hiện

| # | File tạo/sửa | Việc cần làm | Status |
|---|---|---|---|
| 1 | `frontend/app/(dashboard)/settings/permissions/page.tsx` | Xóa nút "Thêm permission", menu context (sửa/xóa), dialog CRUD. Chuyển thành read-only catalog + light/dark theme | [x] |
| 2 | `frontend/app/(dashboard)/settings/roles/page.tsx` | Giữ CRUD role + light/dark theme | [x] |
| 3 | `frontend/app/(dashboard)/settings/roles/matrix/page.tsx` | Giữ tích chọn + light/dark theme | [x] |
| 4 | `frontend/components/RbacConsoleNav.tsx` | Cập nhật label/description + light/dark theme | [x] |
| 5 | `frontend/components/RoleDialog.tsx` | Light/dark theme | [x] |
| 6 | Build verify | `next build` passed ✅ | [x] |
| 7 | `.gemini/memory.md` + `GEMINI.md` | Cập nhật trạng thái | [x] |

**Verify:** Build passed — 0 errors.