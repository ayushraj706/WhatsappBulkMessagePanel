import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        autoComplete="off"
        ref={ref}
        name="message"
        rows={1}
        className={cn(
          "flex w-full resize-none bg-background/50 backdrop-blur-sm",
          "rounded-2xl border border-input/60 px-4 py-3",
          "text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70",
          "shadow-sm transition-all duration-200 ease-out",
          "hover:border-input hover:bg-background/80 hover:shadow-md",
          "focus-visible:border-primary/50 focus-visible:bg-background focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input/60 disabled:hover:shadow-sm",
          className
        )}
        {...props}
      />
    )
  }
)
ChatInput.displayName = "ChatInput"

export { ChatInput }
