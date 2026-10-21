// Phiên đăng nhập giả cho chế độ demo (nhỏ, nạp đồng bộ để có sẵn trước khi app kiểm tra đăng nhập).
const iso = (d: Date) => d.toISOString()
const now = new Date()

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const exp = Math.floor(Date.now() / 1000) + 24 * 3600
export const demoUser = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@namnguyen27.app', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { username: 'Demo' }, created_at: iso(now) }
export const demoSession = {
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: demoUser.id, exp, role: 'authenticated', aud: 'authenticated' })}.demo`,
  refresh_token: 'demo', expires_in: 24 * 3600, expires_at: exp, token_type: 'bearer', user: demoUser,
}
