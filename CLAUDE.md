# DyNAMic — to-do & nhắc việc cá nhân

> File này vừa là **bảng theo dõi dự án** (mục tiêu, các bước, tiến độ), vừa là **hướng dẫn cho Claude** khi làm việc trong folder này.
> Mỗi khi xong một bước: đánh dấu `[x]`, ghi ngày vào **Nhật ký** ở cuối file.

---

## 🎯 Mục tiêu

**DyNAMic** là app nhắc việc cá nhân, dùng một mình, cho cả **công việc** lẫn **việc ngoài công việc**:
- Ghi nhanh việc cần làm, đặt **deadline**, chia nhỏ thành subtask, theo dõi **tiến độ** (%).
- **Nhắc đúng giờ trên iPhone** (thông báo đẩy + Telegram), kể cả khi không mở app.
- Nhìn việc theo nhiều cách: danh sách, Kanban, ma trận Eisenhower (khẩn cấp × quan trọng), lịch.
- Theo dõi **thói quen** (habit) theo chuỗi ngày (streak).
- Thấy việc ngay **trên lịch iPhone / Google Calendar** và trên **widget màn hình chính**.

**Ràng buộc:**
- Web app (PWA) host trên **GitHub Pages**, database **Supabase**.
- Dùng **chung project Supabase và chung tài khoản** (tên + PIN 6 số) với NAMONEY (Web app1) và NomNam (Web app2).
- Điện thoại chính: **iPhone**. App cài bằng Safari → "Thêm vào MH chính".

---

## ▶️ Đang ở đâu & bước tiếp theo (cập nhật 2026-10-17)

**Trạng thái:** **giao diện mới (Phase 1.5) đã code xong và chạy được** (Fraunces + Inter, nâu+teal sáng / 2 màu teal tối, thanh dưới, bảng trượt). Dữ liệu vẫn trên Supabase thật (bảng `dyn_*`); `npm run demo` xem được không cần đăng nhập. **Chưa thử với tài khoản thật và chưa thử trên iPhone** (chỉ kiểm tra bằng chế độ demo + trình duyệt giả lập iPhone). Chưa push, chưa có repo GitHub.

**Việc tiếp theo (theo thứ tự):**
1. 👤 **Bạn thử app thật:** `npm run dev` (http://localhost:5190), đăng nhập bằng tên + PIN, dùng vài ngày, ghi lại chỗ bất tiện (sai chỗ nào, bấm khó chỗ nào, thiếu gì) rồi báo Claude chỉnh. Nên thử cả vuốt trên điện thoại thật (qua `npm run dev -- --host` hoặc sau khi deploy).
2. 👤 Tạo repo GitHub + bật Pages (Source: GitHub Actions) rồi bảo Claude push; cài app lên iPhone (Safari → Chia sẻ → Thêm vào MH chính). Cần có app trên iPhone trước khi làm thông báo đẩy.
3. 🤖 **Phase 2 — Nhắc việc** (xem checklist bên dưới). Cần bạn tạo bot Telegram qua @BotFather và (có thể) cấp quyền deploy Edge Function trên Supabase.
4. Việc nhỏ còn lại của giao diện: bộ màu project (tím `#a855f7`, xanh lá `#22c55e` vẫn tươi, bạn bảo "chưa cần"); logo thật; nhập tiếng Việt tự nhiên, việc lặp lại (Phase 2).

**Việc bạn làm song song (không chặn nhau):** đăng nhập thử bằng tài khoản thật (`npm run dev`), tạo bot Telegram qua @BotFather (cho Phase 2).

**Khi mở session mới:** đọc mục này, rồi `design/mockup-final.html` (nguồn sự thật cho giao diện) và plan `C:\Users\PC\.claude\plans\okay-t-i-mu-n-l-m-rippling-taco.md` (chi tiết kỹ thuật; lưu ý plan còn ghi navy/Source Serif, **đã được thay bằng nâu+teal / Fraunces** như bảng "Quyết định đã chốt" bên dưới).

---

## 🗺️ Lộ trình & tiến độ

Ký hiệu: `[x]` xong · `[ ]` chưa làm · 👤 = việc **bạn** tự làm (Claude không làm thay được).

### Phase 0 — Setup ✅
- [x] Research các app to-do (Todoist, TickTick, Things 3, Vikunja, Super Productivity) → chọn tính năng
- [x] Dựng dự án Vite + React + TypeScript + Tailwind + PWA
- [x] Thiết kế database (bảng `dyn_*`, có sẵn chỗ cho mọi phase) + bảo mật RLS
- [x] Đăng nhập tên + PIN dùng chung với 2 app kia
- [x] Workflow tự deploy lên GitHub Pages
- [x] 👤 Chạy phần **DyNAMic** trong `D:\AI Work\supabase_schema.sql` trên Supabase (xong 2026-10-17, đã kiểm tra bảng `dyn_*` tồn tại)
- [ ] 👤 Đăng nhập thử trên máy (`npm run dev` → http://localhost:5190)
- [ ] 👤 Tạo repo GitHub + bật Pages (Source: GitHub Actions) → Claude push code khi bạn yêu cầu
- [ ] 👤 Cài app lên iPhone (Safari → Chia sẻ → Thêm vào MH chính)
- [x] Logo thật của bạn (`DyNAMic logo2.png`, chữ N ruy-băng teal + chuông vàng) đã thành icon app (2026-10-21). Icon trong `public/` sinh từ file đó (bo góc trong suốt cho icon thường, đáy teal cho apple/maskable); không còn `logo.svg` / `pwa-assets.config.ts`

### Phase 1 — Quản lý việc (MVP) ✅
- [x] Danh sách: Hôm nay · Sắp tới (14 ngày) · Inbox · Quá hạn · Tất cả · Đã xong · Tìm kiếm
- [x] Khu vực (Công việc / Cá nhân / tự thêm) và Project, có % tiến độ
- [x] Task: deadline (cả ngày hoặc có giờ), ưu tiên, tag, ghi chú, trạng thái Cần làm/Đang làm/Xong
- [x] Subtask/checklist → tiến độ tự tính; không có subtask thì kéo thanh %
- [x] Đánh dấu Khẩn cấp / Quan trọng (chuẩn bị cho Eisenhower)
- [x] Ô thêm nhanh: `!1` `!2` `!3` = ưu tiên, `#tag` = gắn tag
- [x] Tìm không dấu, lọc theo ưu tiên / tag, dark mode, giao diện iPhone
- [ ] 👤 Dùng thử vài ngày, ghi lại chỗ thấy bất tiện → báo Claude chỉnh

### Phase 1.5 — Thiết kế lại UI/UX (làm trước Phase 2) ✅ *code xong, chờ bạn thử thật*
Plan: `C:\Users\PC\.claude\plans\okay-t-i-mu-n-l-m-rippling-taco.md`. Lý do: giao diện Phase 1 chưa đủ đơn giản/dễ dùng. Ngôn ngữ thiết kế: Opennote (styles.refero.design) chỉnh cho điện thoại — Fraunces + Inter (Source Serif 4/Lora chỉ là bản thử), giấy kem; màu nhấn nâu đậm (sáng) / teal (tối); bố cục thanh dưới + bảng trượt. Plan file còn ghi navy: **navy đã bị thay bằng nâu/teal**.
Các bản mockup (mở bằng Chrome, giữ lại để so sánh): `design/mockup-v1-nomnam.html` · `design/mockup-v2-navy.html` · `design/mockup-v3.html` (Source Serif 4) · `design/mockup-v3-lora.html` (y hệt nhưng serif = Lora)
- [x] Mockup v1 (kiểu NomNam, xanh chàm): "khá ổn" nhưng quá giống NomNam
- [x] Mockup v2 (Opennote, serif + Inter, navy): chữ hơi to, navy không hợp nền kem
- [x] Mockup v3: chữ nhỏ lại (tên việc 15px, tiêu đề 24px), ngày chỉ là dòng nhỏ; **sáng = nâu đậm `#512906` trên giấy kem, tối = teal `#3dd6c4` trên nền than `#121516`**
- [x] v3 chỉnh lần 2: bản tối **nền dark teal `#0c2a2c`** (các sắc độ teal là gam chủ đạo, chữ trắng); vệt dạ quang vàng bao **trọn cụm từ** ("buổi sáng", "buổi chiều", "Xong hết rồi"); thêm bản font Lora
- [x] v3 chỉnh lần 3: nền sáng **trắng ngà `#fbf6e9`** (đường kẻ ấm `#e7dfcb`); câu chào "Chào buổi sáng" thu nhỏ còn 16px, tiêu đề trang 20px; bản tối dark teal được duyệt ("ok")
- [x] Trang so sánh font `design/fonts-compare.html` (Source Serif 4, Lora, Newsreader, Fraunces, Playfair Display, chỉ Be Vietnam Pro) — vì Source Serif 4 và Lora nhìn giống nhau
- [x] Thêm Hind vào trang so sánh. Lưu ý: Hind **không có gói tiếng Việt** (chỉ devanagari/latin); chữ có 2 dấu chồng (ắ ằ ế ề…) bị lệch dấu → không nên dùng cho app tiếng Việt
- [x] **Font chốt: Fraunces** (serif cho tiêu đề/số/tên khu vực) + Inter (chữ việc, nhãn)
- [x] Trang so sánh màu sáng `design/colors-compare.html`: 6 bảng nâu/vàng/gold, đậm và trầm (A nâu cà phê, B vàng đồng đậm, C nâu+gold, D đồng đỏ+gold, E sô-cô-la+vàng đồng, F vàng olive đậm)
- [x] Tham khảo Refero (styles.refero.design): Superhuman (parchment `#f2f0eb`, Midnight Wine `#421d24`, Deep Lagoon `#0c4243`, mực ấm `#292827`), Cursor (mực ấm `#26251e`, Amber `#c08532` chỉ để điểm xuyết vì chữ kem trên đó chỉ 3,1:1). Không có style Refero nào là teal tối thuần.
- [x] Trang so sánh vòng 2 `design/colors-compare-2.html`: sáng C/G(rượu vang+gold)/H(nâu+teal lagoon); tối D1 (#0c2a2c) / D2 (#0f4a4d) / D3 (#17595d) / D4 (đúng 2 màu teal). Người dùng muốn tối **không quá tối** như màn hình IDE.
- [x] **Chốt màu**: sáng = **H · nâu + teal lagoon** (nền `#fbf6e9`, mực `#26251e`, nút nâu `#4a2c0a`, thẻ/tiến độ/tab teal `#0c4243`); tối = **D4 · đúng 2 màu teal** (nền `#0f4a4d`, điểm nhấn/thẻ nổi `#a8f0e6`, chữ trắng)
- [x] Mockup bản cuối `design/mockup-final.html` (Fraunces + H sáng + D4 tối, 6 màn hình)
- [x] Người dùng duyệt mockup bản cuối ("code đi"; thẻ "Nên làm trước" bản tối không chói; màu project tím/xanh lá giữ nguyên, chưa cần đổi)
- [x] **Nền tảng (code xong 2026-10-17)**: Fraunces (opsz) + Inter tự host qua `@fontsource-variable` (có subset vietnamese); token màu H sáng / D4 tối trong `src/index.css` (biến CSS, đổi theme bằng class `dark`); `ui/Sheet` (vaul), `ui/Chip`, `ui/ProgressLine`; `BottomNav`, `PageHeader`; toast Hoàn tác (sonner)
- [x] **Màn Hôm nay**: câu chào theo giờ (cụm "buổi sáng/trưa/chiều/tối" bôi dạ quang), dòng tóm tắt + chuỗi ngày, thẻ "Nên làm trước" (Xong / Dời), tối đa 2 nhắc phụ, Quá hạn / Có giờ / Trong ngày, "Đã xong hôm nay" gập sẵn; vuốt phải = Xong, vuốt trái = Ngày mai / Xóa; dấu tích vẽ như nét bút. Logic ở `src/lib/insights.ts`, thao tác ở `src/lib/actions.ts`
- [x] **Thêm việc + Chi tiết việc** thành bảng trượt: chip ngày / khu vực / ưu tiên, "Thêm chi tiết" gập sẵn, thêm liên tiếp không đóng bảng, vẫn hiểu `!3 #tag`; xóa có Hoàn tác (khôi phục cả subtask + tag)
- [x] **Sắp tới** (dải ngày + nhóm theo ngày), **Dự án** (tìm kiếm không dấu, Inbox/Đã xong, khu vực + project có %), trang Inbox / Đã xong / Khu vực / Project, **Cài đặt**; cột trái cho máy tính; đã xóa các trang/thành phần cũ (Sidebar, TaskEditor, QuickAdd, ListPages cũ, bộ lọc cố định)
- [x] Logo tạm (đã thay bằng logo thật 2026-10-21)
- [x] Kiểm tra: lint 0 cảnh báo, build qua (bản build không chứa code demo), duyệt ảnh ở 390×844 + 1280×800 sáng/tối, 11 kiểm tra thao tác chạm đều đạt (vuốt, Hoàn tác xong/xóa, Dời, thêm liên tiếp, đổi theme)
- [x] Sửa lỗi phát hiện khi test: "Dời sang hôm nay" cho việc có giờ đã qua thì chuyển thành việc cả ngày hôm nay (trước đây vẫn bị coi là quá hạn)
- [ ] 👤 Thử trên iPhone, xác nhận "đơn giản, dễ dùng"
- [ ] **Sửa theo báo cáo `npm run audit` (2026-10-24)**: (1) toast "Hoàn tác" che tiêu đề tháng + nút ‹ › ở Sắp tới → dời xuống gần thanh dưới hoặc rút ngắn thời gian; (2) nút ‹ › (36px), nút tích tròn ở Sắp tới (40px), tên việc ở thẻ "Nên làm trước" (cao 24px), nút Xong/Dời (cao 40px) → tối thiểu 44px; (3) ô Tìm việc 14px → 16px (iPhone tự phóng to); (4) chữ <12px: nhãn thanh dưới 11.5px, "QUÁ HẠN/CÓ GIỜ", "Đang làm" 11px → tăng ~12.5px; (5) chữ "CN" lịch bản tối tương phản 3.73:1 → ≥4.5:1; (6) kiểm tra thanh dưới có che dòng cuối trang không (chưa chắc, script báo `main` padding-bottom 0)
- [ ] Nhận xét 3 người dùng ảo (Lan/bác Hùng/Minh, chấm 3–3.5/5): ai cũng thiếu **nhắc việc + việc lặp** → ưu tiên Phase 2; Minh thêm thiếu habit + Kanban (Phase 3–4); thêm việc mất 6–7 thao tác (hơi nhiều); thêm đồ án + 3 subtask mất 15 thao tác
- [x] **Sắp tới kiểu TickTick** (2026-10-24): lịch cả tháng ở trên (T2→CN, chấm màu project/khu vực, chấm đỏ = quá hạn, vuốt ngang / ‹ › đổi tháng, nút "Hôm nay"), dưới là danh sách việc của ngày đang chọn ở dạng gọn (`TaskRow dense`: chữ 14px, nhãn Project / 💼 Công việc / 🏠 Cá nhân / Inbox bên phải). Ngày chọn nằm trên URL `?day=&month=` → bảng Thêm việc tự đặt hạn vào ngày đó. Chọn hôm nay thì hiện cả Quá hạn. Bỏ mục "Chưa có deadline" ở trang này (vẫn xem ở Inbox / Dự án)
- [ ] **Bỏ hashtag khỏi giao diện** (người dùng nói "không cần", 2026-10-24): ẩn `#tag` ở `TaskRow` (cả dạng thường và `dense`), bỏ phần tag trong `TaskSheet`, bỏ hướng dẫn `#tag` ở bảng Thêm việc (có thể giữ `!1 !2 !3`)

### Phase 2 — Nhắc việc (trọng tâm) *làm sau Phase 1.5*
- [ ] Bảng `dyn_reminders`: nhiều lần nhắc / 1 việc; mặc định nhắc trước deadline 15 phút
- [ ] Web Push: tạo khóa VAPID, nút "Bật thông báo" trong Cài đặt, lưu thiết bị vào `dyn_push_subscriptions`
- [ ] Telegram bot: 👤 tạo bot qua @BotFather → nút "Kết nối Telegram" trong app
- [ ] Edge Function `send-reminders` + pg_cron chạy mỗi phút → gửi push + Telegram (nút ✅ Xong / ⏰ +15 phút / +1 giờ)
- [ ] Edge Function `telegram-webhook`: nhận bấm nút, lệnh `/today`, `/add`
- [ ] Việc lặp lại (hằng ngày / tuần / tháng / tùy chỉnh): bấm Xong → tự tạo lần sau
- [ ] Tóm tắt 7h sáng qua Telegram: việc hôm nay + quá hạn + habit
- [ ] 👤 Test trên iPhone thật: nhận thông báo khi app đang đóng

### Phase 3 — Cách xem & theo dõi tiến độ
- [ ] Kanban 3 cột (Cần làm / Đang làm / Xong), kéo thả
- [ ] Ma trận Eisenhower 4 ô, kéo thả giữa các ô
- [ ] Lịch tuần/tháng trong app, kéo việc sang ngày khác để đổi deadline
- [ ] Dashboard: số việc xong theo ngày/tuần, tỷ lệ đúng hạn, % từng project, streak

### Phase 4 — Habit tracker
- [ ] Tạo thói quen (ngày nào trong tuần, mục tiêu số lần/ngày, giờ nhắc)
- [ ] Check-in hằng ngày, heatmap kiểu GitHub, streak hiện tại & kỷ lục
- [ ] Nhắc habit qua push/Telegram (nút "✅ Đã làm")

### Phase 5 — Tích hợp ngoài app (iPhone)
- [ ] ICS feed → 👤 subscribe trong Lịch iPhone / Google Calendar (chỉ để xem; Google làm mới chậm vài giờ)
- [ ] Widget màn hình chính bằng app **Scriptable** (việc hôm nay + số việc quá hạn)
- [ ] Siri Shortcut "Thêm việc" (nói với Siri để thêm task)

### Phase 6 — Để sau (tùy chọn)
- [ ] Pomodoro / bấm giờ tập trung
- [ ] Nhập tiếng Việt tự nhiên ("họp thứ 6 3h chiều")
- [ ] Sao lưu / xuất dữ liệu JSON
- [ ] Đồng bộ 2 chiều Google Calendar, hoặc bọc app native (Capacitor) cho widget/push xịn hơn

---

## 📌 Quyết định đã chốt
| Ngày | Quyết định |
|---|---|
| 2026-10-17 | Nhắc việc qua **Web Push (PWA) + Telegram bot**; lịch qua **ICS 1 chiều**; tính năng nâng cao: **Habit + Eisenhower + Kanban** |
| 2026-10-17 | Dùng chung Supabase + đăng nhập tên/PIN với NAMONEY & NomNam |
| 2026-10-17 | Tên app: **DyNAMic**; tiền tố bảng: **`dyn_`** |
| 2026-10-17 | Schema dùng chung cho mọi app đặt ở **`D:\AI Work\supabase_schema.sql`** |
| 2026-10-17 | Giao diện mới: phong cách Opennote chỉnh cho điện thoại; **font Fraunces (tiêu đề/số) + Inter (chữ việc)**; thanh dưới + bảng trượt; ngày chỉ là dòng phụ, câu chào 16px |
| 2026-10-17 | **Theme sáng H**: nền ngà `#fbf6e9`, mực ấm `#26251e`, nút nâu `#4a2c0a`, thẻ/tiến độ/tab teal `#0c4243`. **Theme tối D4**: đúng 2 màu teal (nền `#0f4a4d`, điểm nhấn `#a8f0e6`), chữ trắng |
| 2026-10-17 | Màu project: xanh dương đậm `#1e4f8f` (bản tối `#7db4ff` để đủ tương phản), thay xanh dương nhạt `#0ea5e9` |
| 2026-10-17 | Không dùng Hind (không có gói tiếng Việt); không dùng navy (không hợp nền ngà) |
| 2026-10-24 | **Không cần hashtag (#tag)**: người dùng không dùng → bỏ khỏi giao diện (dòng việc, bảng Thêm việc / Chi tiết, bộ lọc). Bảng `dyn_tags` / `dyn_task_tags` cứ để nguyên trong DB, không cần xóa |

## 📝 Nhật ký
- **2026-10-17** — Research + plan. Xong Phase 0 & 1 (code). Chuyển sang Supabase dùng chung, đăng nhập tên + PIN, đổi tên DyNAMic, tách schema ra file chung. 
- **2026-10-17** — Đã chạy schema trên Supabase (bảng `dyn_*` OK). Thêm chế độ demo `npm run demo` (dữ liệu mẫu, không cần đăng nhập). Người dùng thấy giao diện chưa đủ đơn giản → thiết kế lại UI/UX trước khi làm Phase 2.
- **2026-10-17** — Chốt hướng thiết kế (cùng họ NomNam, màu nhấn xanh chàm, thanh dưới + bảng trượt, màn Hôm nay có câu chào/tóm tắt/gợi ý). Xong mockup tĩnh, chờ người dùng duyệt.
- **2026-10-17** — Người dùng thấy mockup v1 giống NomNam → đổi sang phong cách Opennote (navy, serif, giấy kem, dùng chủ yếu trên điện thoại). Xong mockup v2, chờ duyệt.
- **2026-10-17** — Vài vòng góp ý (chữ to, navy không hợp nền ngà, dạ quang phải bao trọn cụm từ, nền tối phải là teal chứ không đen): so sánh font (Fraunces thắng), so sánh màu 2 vòng, tham khảo Refero. **Chốt**: Fraunces + Inter, sáng = nâu + teal lagoon (H), tối = 2 màu teal (D4). Xong `design/mockup-final.html`; đổi xanh dương project sang đậm. Chưa code giao diện mới. Bước tiếp: duyệt mockup cuối → code "Nền tảng" (xem mục "Đang ở đâu").
- **2026-10-17** — Người dùng duyệt mockup cuối ("code đi"). **Code xong toàn bộ giao diện mới** (nền tảng, Hôm nay, bảng trượt Thêm việc/Chi tiết, Sắp tới, Dự án, Cài đặt, cột trái desktop). Lint sạch, build qua, 11/11 kiểm tra thao tác chạm đạt; sửa 1 lỗi thật ("Dời sang hôm nay" cho việc có giờ đã qua) và để khay vuốt ẩn không nhận bàn phím (`inert`). Logo tạm đổi sang nâu + teal. Chưa thử với tài khoản thật / iPhone thật, chưa push. Bước tiếp: bạn dùng thử rồi báo chỗ cần chỉnh → Phase 2 (nhắc việc).
- **2026-10-21** — Tạo repo GitHub, push lần đầu (Pages bằng GitHub Actions). Thay logo tạm bằng logo thật `DyNAMic logo2.png` (icon PWA, apple-touch, favicon, logo trong app), push lại.
- **2026-10-22** — Sửa icon (tràn viền, không còn viền trắng; đổi tên file `-v3` để iPhone tải lại). Trang đăng nhập: đọc tên/PIN thẳng từ ô (iPhone tự điền), màu ô tự điền theo theme, thanh trạng thái `default` như NomNam, `min-h-dvh`. Sự cố "chạm ô đăng nhập không hiện bàn phím" khi mở từ màn hình chính: chẩn đoán cho thấy ô có nhận focus, NomNam cũng bị → **lỗi iOS 18.1.1, khởi động lại iPhone là hết**. Đã gỡ khung chẩn đoán. Người dùng bắt đầu dùng thử trên iPhone.
- **2026-10-24** — Theo góp ý (thích màn to-do của TickTick): làm lại trang Sắp tới thành lịch tháng + danh sách gọn có nhãn project/khu vực. Lint sạch, build qua, kiểm tra bằng demo (sáng/tối, chọn ngày, thêm việc vào ngày đã chọn, đổi tháng). Chưa commit/push.
- **2026-10-24** — Thêm `npm run audit` (Playwright + Chrome có sẵn): quét tĩnh + 3 người dùng ảo (Lan, bác Hùng, Minh). Sửa demo backend (thêm việc thiếu `created_at` làm sập bảng chi tiết — chỉ ở demo). Chưa commit.
- **2026-10-24** — Commit + push (2 commit: Sắp tới kiểu TickTick; audit + CLAUDE.md) → GitHub Pages tự deploy. Bước tiếp: bạn thử trên iPhone, rồi Phase 2.
- *(Ghi chú sự cố nhỏ: mockup đầu từng bị ghi đè nhầm; đã khôi phục thành `mockup-v1-nomnam.html`. Từ nay mỗi phiên bản mockup là một file riêng, không ghi đè.)*

---

## 🤖 Hướng dẫn cho Claude

Nói chuyện bằng **tiếng Việt**; người dùng không phải dev → giải thích đơn giản, đưa lệnh copy-paste được, nói rõ cái gì đã/chưa push. Plan chi tiết ban đầu: `C:\Users\PC\.claude\plans\okay-t-i-mu-n-l-m-rippling-taco.md`. **Cập nhật checklist + nhật ký ở trên mỗi khi xong việc.**

### Lệnh
- `npm run dev` → http://localhost:5190 (**không** dùng 5173: project khác của người dùng chạy ở đó)
- `npm run build` (tsc -b + vite build + service worker) · `npm run lint` (oxlint, phải 0 cảnh báo)
- `npm run audit` → quét UI/UX (font, cỡ chữ, vùng chạm, tương phản) + 3 người dùng ảo dùng thử ở chế độ demo; báo cáo ở `scripts/ux-audit/out/report.md` (cần Chrome; `-- --seed=N` để chạy ngẫu nhiên khác)

### Supabase (dùng chung với Web app1 NAMONEY `fin_*`, Web app2 NomNam)
- Schema chung: **`D:\AI Work\supabase_schema.sql`** (ngoài repo, không có trong git) — phần DyNAMic ở cuối file. Sửa bảng `dyn_*` thì sửa ở đó, giữ idempotent (`if not exists`, `drop policy if exists`). Người dùng tự dán vào SQL Editor; Claude không có (và không được xin) service_role key.
- Mọi bảng tiền tố **`dyn_`**, có `user_id` + RLS "own rows" + `revoke all from anon`.
- **Không** tạo trigger trên `auth.users`. Dữ liệu mặc định tạo ở client: `ensureDefaults()` trong `src/lib/api.ts`.
- URL + publishable key ở `.env`, **commit có chủ đích** (công khai được nhờ RLS). Không bao giờ đưa secret key vào repo/chat.
- Đăng nhập tên + PIN: `src/lib/auth.ts`, chép từ Web app1 — giữ đồng bộ với 2 app kia, **không đổi `EMAIL_DOMAIN`**. Cần "Confirm email" tắt (đang tắt). "Allow new users to sign up" vẫn bật (ảnh hưởng cả 3 app, người dùng tự quyết).
- Kiểm tra nhanh bảng đã tạo chưa: `GET <url>/rest/v1/dyn_tasks?limit=0` với publishable key → `PGRST205` = chưa có; `42501` = đã có (anon bị chặn, đúng ý).

### Quy ước code
- Vite 8 + React 19 + TS 6, Tailwind v4 (`src/index.css`; `btn-*`, `input`, `chip` định nghĩa bằng `@utility`), TanStack Query (optimistic update trong `src/lib/api.ts`), HashRouter, `base: './'`, vite-plugin-pwa `injectManifest` với `src/sw.ts` (tsconfig riêng `tsconfig.sw.json`).
- Không dùng `window.confirm()`/`prompt()` → `ConfirmButton` (bấm 2 lần) hoặc ô nhập tại chỗ.
- Không dùng `crypto.randomUUID` (lỗi trên http LAN) → `newId()` trong `src/lib/tasks.ts`.
- Trình sửa task mở bằng query `?task=<id>` (`useOpenTask`); service worker mở thông báo theo cách này.
- Ngày giờ lưu `timestamptz`; "cả ngày" = `all_day=true` + `due_at` 00:00 giờ địa phương. Logic ngày: `src/lib/dates.ts`.
- Kiểm tra giao diện không cần Supabase thật: script Playwright với backend giả lập (chặn `https://demo.supabase.co`) + `.env.local` tạm (`VITE_SUPABASE_URL=https://demo.supabase.co`) — **xóa `.env.local` sau khi test**.

### Deploy
Push `main` → `.github/workflows/deploy.yml` → GitHub Pages. **Chỉ push khi người dùng yêu cầu.** Repo: https://github.com/hoanganhkiet14021996/DyNAMic (đã push 2026-10-21), app tại https://hoanganhkiet14021996.github.io/DyNAMic/. `gh` CLI chưa cài, push bằng `git` (Git Credential Manager).

### Môi trường
iPhone người dùng: iOS 18.1.1. Nếu web app trên màn hình chính không hiện bàn phím (cả NomNam cũng bị) → khởi động lại iPhone, không phải lỗi code.
Windows 11. Không ghi file nguồn bằng PowerShell `Set-Content`/`Out-File` (thêm BOM, hỏng UTF-8) — dùng Edit/Write.
