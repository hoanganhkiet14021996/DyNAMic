/** Hình vẽ nét tay (đen, mảnh) — chỉ dùng ở trạng thái trống để danh sách luôn sạch. */
export function NotepadDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 130"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <g transform="rotate(-4 70 68)">
        <rect x="32" y="22" width="76" height="92" rx="6" />
        <path d="M46 52l8 8 14-16" />
        <path d="M46 82h44M46 96h30" />
      </g>
      <path d="M104 26l22 40-8 4-22-40z" />
      <path d="M96 30l8-4" />
      <path d="M118 70l-4 12 12-6" />
      <path d="M20 40l6 3M14 60h8M24 22l4 7" strokeWidth={1.6} />
    </svg>
  )
}
