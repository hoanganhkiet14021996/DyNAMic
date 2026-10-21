# DyNAMic

**DyNAMic**: web app to-do / nhắc việc cá nhân. Giao diện là PWA chạy trên **GitHub Pages**, dữ liệu lưu ở **Supabase**.

Mục tiêu, checklist từng bước và nhật ký dự án: xem **[CLAUDE.md](CLAUDE.md)**. Tóm tắt:

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Setup dự án, schema DB (`dyn_*`), đăng nhập tên + PIN dùng chung, deploy GitHub Pages | ✅ |
| 1 | MVP: task, subtask, deadline, ưu tiên, tag, khu vực/project, tiến độ, tìm kiếm, PWA | ✅ |
| 2 | Nhắc việc: Web Push + Telegram bot, việc lặp lại, tóm tắt buổi sáng | ⏳ |
| 3 | Kanban, ma trận Eisenhower, lịch trong app, dashboard | ⏳ |
| 4 | Habit tracker | ⏳ |
| 5 | ICS feed cho lịch, widget Scriptable, Siri Shortcut | ⏳ |

## Cài đặt lần đầu

App dùng **chung project Supabase và chung tài khoản** với NAMONEY (Web app1) và NomNam (Web app2).
Bạn đăng nhập bằng **tên + mã PIN 6 số**, giống 2 app kia. Bảng của app này có tiền tố `dyn_`, nên không đụng dữ liệu của app khác.

### 1. Tạo bảng trên Supabase (chỉ làm 1 lần)
1. Vào Supabase → **SQL Editor** → **New query**.
2. Mở file **`D:\AI Work\supabase_schema.sql`** (file schema dùng chung cho mọi app, nằm ngoài folder này). Dán phần **DyNAMic** (cuối file), hoặc cả file, rồi bấm **Run**. Nếu Supabase cảnh báo, chọn **Run and enable RLS**.

Chạy lại file này nhiều lần cũng không sao.

### 2. Chạy trên máy
```bash
npm install
npm run dev        # http://localhost:5190 (5173 đang dùng cho project khác)
```
File `.env` (URL + publishable key) đã có sẵn và được commit, giống 2 app kia. Key này công khai được vì mọi bảng đều bật Row Level Security.

### 3. Deploy lên GitHub Pages
1. Tạo repo trên GitHub rồi push code lên nhánh `main`.
2. Vào **Settings → Pages → Source**, chọn **GitHub Actions**.
3. Từ giờ, mỗi lần push lên `main` thì app tự build và deploy. Không cần secret hay khai báo tên repo, vì app dùng đường dẫn tương đối `./` và HashRouter.

### 4. Cài lên iPhone
Mở link app bằng **Safari**, bấm **Chia sẻ → Thêm vào MH chính**. Từ đó mở app bằng icon trên màn hình chính (bắt buộc để nhận thông báo đẩy ở Phase 2).

## Mẹo dùng
- Ô thêm nhanh hiểu cú pháp `!1` / `!2` / `!3` (ưu tiên thấp / trung bình / cao) và `#tag` (tự tạo tag nếu chưa có).
  Ví dụ: `Gửi báo cáo tháng !3 #sếp`.
- Thêm việc từ trang **Hôm nay** thì deadline tự đặt là hôm nay.
- Tiến độ của task tự tính theo subtask. Nếu task không có subtask, kéo thanh % trong trình sửa.
- Tìm kiếm không phân biệt dấu: gõ `hop` vẫn ra "họp".

## Bảo mật
- Key publishable để công khai được vì mọi bảng đều bật **Row Level Security** (`user_id = auth.uid()`), và khách chưa đăng nhập bị `revoke` hoàn toàn.
- Tuyệt đối **không** đưa `service_role` / secret key vào `.env` hay vào repo.
- Schema không gắn trigger nào vào `auth.users`, vì project dùng chung, trigger lỗi sẽ chặn đăng ký ở mọi app.

## Cấu trúc
```
src/
  auth/          đăng nhập, session
  components/    Layout, Sidebar, TaskItem, TaskEditor, QuickAdd, ...
  pages/         Hôm nay, Sắp tới, Inbox, Project, Khu vực, Tìm kiếm, Cài đặt
  lib/           supabase client, API hooks (TanStack Query), xử lý ngày giờ
  sw.ts          service worker (cache offline + nhận push)
../supabase_schema.sql  schema dùng chung mọi app (phần DyNAMic: bảng dyn_*)
```
