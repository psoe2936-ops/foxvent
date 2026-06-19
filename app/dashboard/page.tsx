import { NavbarServer } from '@/components/navbar/navbar-server'
import { ProfileView } from '@/components/profile/profile-view'

export default function DashboardPage() {
  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-[#F9FAFB]">
        <ProfileView />
      </main>
    </>
  )
}
