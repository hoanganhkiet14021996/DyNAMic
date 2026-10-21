import { useState, type FormEvent } from 'react'
import { PIN_LENGTH, signInWithPin, signUpWithPin } from '../lib/auth'

/** Đăng nhập "tên + PIN 6 số" — dùng chung tài khoản với NAMONEY và NomNam. */
export function LoginPage() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signin') await signInWithPin(name, pin)
      else await signUpWithPin(name, pin)
    } catch (err) {
      setMsg((err as Error).message)
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pt-safe flex min-h-full items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="mb-6 text-center">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="mx-auto mb-3 h-16 w-16" />
          <h1 className="font-serif text-2xl font-normal">DyNAMic</h1>
          <p className="text-sm text-cap">
            {mode === 'signin' ? 'Đăng nhập bằng tài khoản dùng chung với NAMONEY / NomNam' : 'Tạo tài khoản mới'}
          </p>
        </div>
        <input
          className="input"
          placeholder="Tên đăng nhập"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input text-center tracking-[0.5em]"
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={PIN_LENGTH}
          placeholder={`Mã PIN ${PIN_LENGTH} số`}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          required
        />
        <button className="btn-primary h-12 w-full" disabled={busy || pin.length !== PIN_LENGTH}>
          {busy ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
        {msg && <p className="text-center text-sm text-oxblood">{msg}</p>}
        <button
          type="button"
          className="w-full text-center min-h-11 text-xs text-cap underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setMsg(null)
          }}
        >
          {mode === 'signin' ? 'Chưa có tài khoản? Tạo mới' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
