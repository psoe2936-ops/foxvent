'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const BORDER_COLOR: Record<ToastType, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-amber-500',
}

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-amber-500',
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: number) => void
}) {
  const Icon =
    toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info

  return (
    <div
      className={`pointer-events-auto flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-l-4 border-[#E5E7EB] bg-white px-4 py-3 shadow-lg ${BORDER_COLOR[toast.type]}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${ICON_COLOR[toast.type]}`} />
      <p className="flex-1 text-sm leading-snug text-[#1F2937]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counterRef.current
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col items-end gap-2 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
