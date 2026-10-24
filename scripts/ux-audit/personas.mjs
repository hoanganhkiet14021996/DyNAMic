// 3 người dùng ảo. Mỗi người có: mục tiêu cố định (đo số chạm) + hành động ngẫu nhiên theo hạt giống + danh sách nhu cầu.
// `needs`: [mô tả, regex tìm trong chữ hiển thị của app] — có tính năng thì app phải hiện chữ đó ở đâu đó.

export const personas = [
  {
    id: 'lan',
    name: 'Lan',
    age: 28,
    role: 'Nhân viên văn phòng (marketing)',
    theme: 'light',
    seed: 11,
    typesNoAccent: false,
    story: 'Họp liên tục, nhiều deadline từ sếp. Muốn thấy ngay hôm nay phải làm gì, được nhắc trước giờ họp, tách việc công ty / việc nhà.',
    goals: [
      { text: 'Gửi slide cho sếp !3 #gấp', due: 'Hôm nay', label: 'thêm việc ưu tiên cao có tag' },
      { text: 'Đặt lịch họp khách hàng', due: 'Ngày mai', label: 'thêm việc cho ngày mai' },
    ],
    needs: [
      ['Nhắc việc trước giờ họp (thông báo)', /nhắc/i],
      ['Đặt giờ cụ thể cho việc', /giờ/i],
      ['Tách Công việc / Cá nhân', /công việc/i],
      ['Xem lịch cả tháng', /tháng/i],
      ['Việc lặp lại (họp tuần)', /lặp|hằng|mỗi/i],
    ],
  },
  {
    id: 'hung',
    name: 'Bác Hùng',
    age: 58,
    role: 'Chủ cửa hàng vật liệu xây dựng',
    theme: 'light',
    seed: 22,
    typesNoAccent: true,
    story: 'Mắt kém, ít dùng app, gõ tiếng Việt không dấu. Chỉ cần ghi việc (gọi nhà cung cấp, thu tiền) và tích xong. Sợ bấm nhầm rồi mất.',
    goals: [
      { text: 'goi nha cung cap xi mang', due: 'Hôm nay', label: 'ghi việc không dấu' },
      { text: 'thu tien cong no', due: 'Tuần sau', label: 'ghi việc tuần sau' },
    ],
    needs: [
      ['Chữ đủ to, dễ đọc', /./],
      ['Tìm việc gõ không dấu', /tìm/i],
      ['Hoàn tác khi bấm nhầm', /hoàn tác/i],
      ['Nhắc việc qua thông báo/Zalo/Telegram', /nhắc|telegram/i],
      ['Việc lặp (thu tiền hằng tháng)', /lặp|hằng|mỗi/i],
    ],
  },
  {
    id: 'minh',
    name: 'Minh',
    age: 21,
    role: 'Sinh viên năm 3 CNTT',
    theme: 'dark',
    seed: 33,
    typesNoAccent: false,
    story: 'Dùng dark mode, một tay, thêm việc cực nhanh giữa giờ học. Muốn theo dõi deadline bài tập, chia nhỏ đồ án thành subtask, tập thói quen (code mỗi ngày).',
    goals: [
      { text: 'Nộp bài tập CTDL !2 #học', due: 'Ngày mai', label: 'thêm bài tập có hạn' },
      { text: 'Làm đồ án nhóm', due: 'Tuần sau', label: 'thêm đồ án để chia subtask', subtasks: ['Viết báo cáo', 'Làm slide', 'Code backend'] },
    ],
    needs: [
      ['Subtask / tiến độ %', /subtask|tiến độ/i],
      ['Thói quen (habit) theo chuỗi ngày', /thói quen|streak|chuỗi/i],
      ['Dark mode', /tối/i],
      ['Kanban / ma trận ưu tiên', /kanban|eisenhower|ma trận/i],
      ['Lặp lại việc học', /lặp|hằng|mỗi/i],
    ],
  },
]

// PRNG có hạt giống (mulberry32) để chạy lại ra cùng kết quả
export function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RANDOM_TITLES = ['Mua đồ ăn tối', 'Gọi điện cho mẹ', 'In tài liệu', 'Trả lời email', 'Đóng tiền điện', 'Đi khám răng', 'Chuẩn bị bài thuyết trình']
const SEARCH_WORDS = ['bao cao', 'hop', 'mua', 'gui']

/** Các hành động ngẫu nhiên. Mỗi hàm nhận `h` (bộ trợ giúp) và ném lỗi nếu không làm được. */
export const randomActions = {
  'thêm việc nhanh': async (h, r) => h.addTask(RANDOM_TITLES[Math.floor(r() * RANDOM_TITLES.length)] + (r() < 0.4 ? ' !2' : '')),
  'tích xong 1 việc': async (h) => (await h.rowBox(), h.completeFirst()),
  'mở chi tiết việc': async (h) => {
    await h.openFirstTask()
    await h.closeSheet()
  },
  'vuốt phải = xong': async (h) => h.swipeFirst('right'),
  'vuốt trái = dời ngày mai': async (h) => h.swipeFirst('left-move'),
  'đổi tab': async (h, r) => h.goTab(['Hôm nay', 'Sắp tới', 'Dự án'][Math.floor(r() * 3)]),
  'Sắp tới: đổi tháng': async (h, r) => {
    await h.goTab('Sắp tới')
    await h.page.getByRole('button', { name: r() < 0.5 ? 'Tháng sau' : 'Tháng trước' }).click({ timeout: 2500 })
  },
  'Sắp tới: chọn một ngày': async (h, r) => {
    await h.goTab('Sắp tới')
    const days = h.page.locator('[role=group][aria-label="Chọn ngày"] button')
    await days.nth(Math.floor(r() * (await days.count()))).click({ timeout: 2500 })
  },
  'tìm việc': async (h, r) => {
    await h.goTab('Dự án')
    await h.page.getByLabel('Tìm việc').fill(SEARCH_WORDS[Math.floor(r() * SEARCH_WORDS.length)], { timeout: 2500 })
    await h.page.waitForTimeout(300)
  },
  'thêm subtask': async (h, r) => {
    await h.goTab('Hôm nay')
    await h.openFirstTask()
    await h.addSubtask('Bước ' + Math.ceil(r() * 9))
    await h.closeSheet()
  },
}
