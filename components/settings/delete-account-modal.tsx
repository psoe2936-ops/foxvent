'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function DeleteAccountModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#9CA3AF] underline underline-offset-2 hover:text-[#C0392B]"
      >
        Delete account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white/95 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:rounded-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-[#9CA3AF] hover:text-[#6B7280]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-base font-bold text-[#1F2937]">Delete account</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Account deletion is handled by our support team to protect your data
              and active listings.
            </p>
            <p className="mt-3 text-sm text-[#6B7280]">
              Please email{' '}
              <a
                href="mailto:support@foxvent.com"
                className="font-medium text-[#F36D21] hover:underline"
              >
                support@foxvent.com
              </a>{' '}
              from your registered address and we&apos;ll process your request within
              48 hours.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#F3F4F6] py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#E5E7EB]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
