import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageLoading from "./message-loading";
import { Button, ButtonProps } from "@/components/ui/button";

// ─────────────────────────────────────────
// ChatBubble
// ─────────────────────────────────────────
const chatBubbleVariant = cva(
  "flex gap-3 max-w-[75%] items-end relative group transition-all duration-200",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-center",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  },
);

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout, className }),
        "relative group",
      )}
      ref={ref}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child,
      )}
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";

// ─────────────────────────────────────────
// ChatBubbleAvatar
// ─────────────────────────────────────────
interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  src,
  fallback,
  className,
}) => (
  <Avatar className={cn("h-9 w-9 ring-2 ring-background shadow-sm", className)}>
    <AvatarImage src={src} alt="Avatar" className="object-cover" />
    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
      {fallback}
    </AvatarFallback>
  </Avatar>
);

// ─────────────────────────────────────────
// ChatBubbleMessage
// ─────────────────────────────────────────
const chatBubbleMessageVariants = cva("px-4 py-3 text-sm leading-relaxed shadow-sm", {
  variants: {
    variant: {
      received:
        "bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md border border-border/40",
      sent: "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-md",
    },
    layout: {
      default: "",
      ai: "border-t w-full rounded-none bg-transparent shadow-none",
    },
  },
  defaultVariants: {
    variant: "received",
    layout: "default",
  },
});

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(
  (
    { className, variant, layout, isLoading = false, children, ...props },
    ref,
  ) => (
    <div
      className={cn(
        chatBubbleMessageVariants({ variant, layout, className }),
        "break-words max-w-full whitespace-pre-wrap",
      )}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 min-h-[20px]">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  ),
);
ChatBubbleMessage.displayName = "ChatBubbleMessage";

// ─────────────────────────────────────────
// ChatBubbleTimestamp
// ─────────────────────────────────────────
interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  className,
  ...props
}) => (
  <div 
    className={cn(
      "text-[11px] mt-1.5 opacity-60 font-medium tracking-wide",
      className
    )} 
    {...props}
  >
    {timestamp}
  </div>
);

// ─────────────────────────────────────────
// ChatBubbleAction
// ─────────────────────────────────────────
type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode;
};

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  onClick,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    className={cn(
      "h-8 w-8 rounded-full opacity-70 hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all duration-150",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {icon}
  </Button>
);

// ─────────────────────────────────────────
// ChatBubbleActionWrapper
// ─────────────────────────────────────────
interface ChatBubbleActionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  className?: string;
}

const ChatBubbleActionWrapper = React.forwardRef<
  HTMLDivElement,
  ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200",
      variant === "sent"
        ? "-left-2 -translate-x-full flex-row-reverse"
        : "-right-2 translate-x-full",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper";

// ─────────────────────────────────────────
// Exports
// ─────────────────────────────────────────
export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  chatBubbleVariant,
  chatBubbleMessageVariants,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
};
