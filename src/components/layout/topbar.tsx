"use client"

import { Bell, Search, Menu, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Topbar() {
    return (
        <header className="sticky top-0 z-30 h-16 w-full flex items-center justify-between px-4 lg:px-8 bg-[#0F0A12]/60 backdrop-blur-md border-b border-[#E040FB]/5">

            {/* Search Input */}
            <div className="flex items-center flex-1">
                <div className="relative w-full max-w-md hidden md:flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-[#6B5280]" />
                    <Input
                        placeholder="Buscar en LUMIS... (Ctrl+K)"
                        className="pl-9 h-10 bg-[#1A1220]/50 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/30 rounded-full"
                    />
                    <div className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0F0A12] text-[#6B5280] border border-[#E040FB]/10 flex items-center gap-0.5">
                        <Command className="w-3 h-3" /> K
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#E040FB]/10 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E040FB] shadow-[0_0_8px_rgba(224,64,251,0.8)]" />
                </button>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-sm font-medium text-[#F5EEFF] group-hover:text-[#E040FB] transition-colors">
                                    Juan Pérez
                                </span>
                                <span className="text-xs text-[#6B5280]">Administrador</span>
                            </div>
                            <Avatar className="h-9 w-9 border border-[#E040FB]/20 ring-2 ring-transparent group-hover:ring-[#E040FB]/40 transition-all">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback className="bg-[#1A1220] text-[#E040FB]">JP</AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#1A1220]/95 backdrop-blur-xl border-[#E040FB]/20 text-[#F5EEFF]">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#E040FB]/10" />
                        <DropdownMenuItem className="focus:bg-[#E040FB]/10 focus:text-[#F5EEFF] cursor-pointer">
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-[#E040FB]/10 focus:text-[#F5EEFF] cursor-pointer">
                            Suscripción
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#E040FB]/10" />
                        <DropdownMenuItem className="text-[#FF4757] focus:bg-[#FF4757]/10 focus:text-[#FF4757] cursor-pointer">
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
