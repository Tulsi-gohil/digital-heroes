'use client'

import { InputHTMLAttributes, ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
}

export default function AuthField({ label, icon, type = 'text', id, ...props }: AuthFieldProps) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-white/70">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          className={[
            'w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-white placeholder:text-white/30',
            'transition-all duration-300 focus:border-emerald-400/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-400/20',
            icon ? 'pl-11' : 'pl-4',
            isPassword ? 'pr-12' : 'pr-4',
          ].join(' ')}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
