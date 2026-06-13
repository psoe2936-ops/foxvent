import { cn } from '@/lib/utils'

type FoxIconProps = {
  className?: string
}

export function FoxIcon({ className }: FoxIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('size-9 shrink-0', className)}
    >
      <path
        d="M28 5C22 5 17 9 15 15L11 8L14 18C11 22 9 27 9 33C9 42 17 50 28 50C39 50 47 42 47 33C47 27 45 22 42 18L45 8L41 15C39 9 34 5 28 5Z"
        fill="#F36D21"
      />
      <path d="M17 14L20 22L24 17L17 14Z" fill="#2D2E32" />
      <path d="M39 14L36 22L32 17L39 14Z" fill="#2D2E32" />
      <path d="M20 18L23 24L27 20L20 18Z" fill="white" />
      <path d="M36 18L33 24L29 20L36 18Z" fill="white" />
      <path
        d="M28 23C22.5 23 18.5 28 18.5 34.5C18.5 41 22.5 45.5 28 45.5C33.5 45.5 37.5 41 37.5 34.5C37.5 28 33.5 23 28 23Z"
        fill="white"
      />
      <ellipse cx="22.5" cy="31.5" rx="3.4" ry="4.2" fill="#2D2E32" />
      <circle cx="23.5" cy="30.2" r="1" fill="white" />
      <ellipse cx="33.5" cy="31.5" rx="3.4" ry="4.2" fill="#2D2E32" />
      <circle cx="34.5" cy="30.2" r="1" fill="white" />
      <path d="M28 38.5L25.8 42.2H30.2L28 38.5Z" fill="#2D2E32" />
    </svg>
  )
}
