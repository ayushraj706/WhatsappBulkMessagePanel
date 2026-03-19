import * as React from "react"
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ ...props }, ref) => (
  <textarea ref={ref} className="w-full bg-transparent outline-none resize-none" {...props} />
))
