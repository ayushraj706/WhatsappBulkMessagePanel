import * as React from "react"
import { cn } from "@/lib/utils"

// Avatar component ab className bhi lega
export const Avatar = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("w-8 h-8 rounded-full overflow-hidden flex-shrink-0", className)}>
    {children}
  </div>
)

export const AvatarImage = ({ src, alt }: { src: string, alt?: string }) => (
  <img src={src} alt={alt || "Avatar"} className="w-full h-full object-cover" />
)

export const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-700 w-full h-full flex items-center justify-center text-xs text-white">
    {children}
  </div>
)
