'use client'

export function ContactSupportButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
      className={className}
    >
      Contact Support
    </button>
  )
}
