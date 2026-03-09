import React from "react"
import { Sparkles } from "lucide-react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-[#E040FB]/15 blur-[150px]" />
                <div className="absolute bottom-[5%] -right-[15%] w-[50%] h-[50%] rounded-full bg-[#7C4DFF]/10 blur-[130px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-[#F8C0FF]/5 blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center mb-5 shadow-glow">
                    <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#E040FB] via-[#F8C0FF] to-[#7C4DFF] bg-clip-text text-transparent">
                    LUMIS
                </h1>
                <p className="text-text-secondary text-sm mt-1.5 text-center">
                    ERP/CRM Inteligente para tu Negocio
                </p>
            </div>

            <div className="z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
