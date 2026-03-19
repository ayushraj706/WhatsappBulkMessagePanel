import * as React from "react"
export const Avatar = ({ children }: { children: React.ReactNode }) => <div className="w-8 h-8 rounded-full overflow-hidden">{children}</div>
export const AvatarImage = ({ src }: { src: string }) => <img src={src} className="w-full h-full object-cover" />
export const AvatarFallback = ({ children }: { children: React.ReactNode }) => <div className="bg-gray-700 w-full h-full flex items-center justify-center text-xs">{children}</div>

