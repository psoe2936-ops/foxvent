import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()

  return (
    <pre>
      {JSON.stringify(
        {
          connected: true,
        },
        null,
        2
      )}
    </pre>
  )
}
