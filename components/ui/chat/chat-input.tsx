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
          "flex w-full resize-none bg-transparent px-0 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
ChatInput.displayName = "ChatInput"

export { ChatInput }
