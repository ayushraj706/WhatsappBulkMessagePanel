import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { cn } from "@/lib/utils";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, ref) => {
    const {
      scrollRef,
      isAtBottom,
      autoScrollEnabled,
      scrollToBottom,
      disableAutoScroll,
    } = useAutoScroll({
      smooth,
      content: children,
    });

    // Merge refs properly
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        // Set internal scrollRef
        if (scrollRef && typeof scrollRef === "object" && "current" in scrollRef) {
          (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        // Set forwarded ref
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && typeof ref === "object" && "current" in ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [scrollRef, ref]
    );

    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-background to-muted/20">
        {/* Scrollable Area */}
        <div
          className={cn(
            "flex flex-col w-full h-full px-4 py-6 overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40",
            "scroll-smooth",
            className
          )}
          ref={setRefs}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          {...props}
        >
          <div className="flex flex-col gap-4 min-h-full">{children}</div>
          
          {/* Bottom spacer for breathing room */}
          <div className="h-4 shrink-0" />
        </div>

        {/* Scroll to Bottom Button */}
        {!isAtBottom && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="h-9 px-4 gap-2 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span className="text-xs font-medium">New messages</span>
            </Button>
          </div>
        )}

        {/* Top fade gradient for depth */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-[5]" />
      </div>
    );
  },
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
