import { redirect } from 'next/navigation'

export default function ResetPasswordRedirect() {
  redirect('/en/auth/reset-password')
}