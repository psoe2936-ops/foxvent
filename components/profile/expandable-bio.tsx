'use client'

import { useState } from 'react'

export function ExpandableBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = bio.length > 120
  const displayBio = isLong && !expanded ? bio.slice(0, 120).trimEnd() + '…' : bio

  return (
    <div>
      <p className="text-sm leading-relaxed text-[#4B5563]">{displayBio}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-1 text-xs font-medium text-[#F36D21] hover:underline"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
