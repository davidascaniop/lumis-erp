import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#0F0A12] flex overflow-hidden">
            {/* Ambient Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E040FB]/5 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-[#7C4DFF]/5 blur-[100px] pointer-events-none" />

            <Sidebar />
            <div className="flex-1 flex flex-col relative z-10 w-full">
                <Topbar />
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    )
}
