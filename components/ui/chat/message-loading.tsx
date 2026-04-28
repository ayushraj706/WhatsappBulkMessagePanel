import * as React from "react";

export default function MessageLoading() {
  return (
    <div className="flex items-center gap-1 py-1">
      <svg
        width="40"
        height="24"
        viewBox="0 0 40 24"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
      >
        <circle cx="8" cy="12" r="3" fill="currentColor" opacity="0.4">
          <animate
            id="dot1"
            begin="0;dot3.end+0.3s"
            attributeName="cy"
            calcMode="spline"
            dur="0.7s"
            values="12;6;12"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="0;dot3.end+0.3s"
            attributeName="opacity"
            calcMode="spline"
            dur="0.7s"
            values="0.4;1;0.4"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="0;dot3.end+0.3s"
            attributeName="r"
            calcMode="spline"
            dur="0.7s"
            values="3;4;3"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
        </circle>
        
        <circle cx="20" cy="12" r="3" fill="currentColor" opacity="0.4">
          <animate
            id="dot2"
            begin="dot1.begin+0.15s"
            attributeName="cy"
            calcMode="spline"
            dur="0.7s"
            values="12;6;12"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="dot1.begin+0.15s"
            attributeName="opacity"
            calcMode="spline"
            dur="0.7s"
            values="0.4;1;0.4"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="dot1.begin+0.15s"
            attributeName="r"
            calcMode="spline"
            dur="0.7s"
            values="3;4;3"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
        </circle>
        
        <circle cx="32" cy="12" r="3" fill="currentColor" opacity="0.4">
          <animate
            id="dot3"
            begin="dot1.begin+0.3s"
            attributeName="cy"
            calcMode="spline"
            dur="0.7s"
            values="12;6;12"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="dot1.begin+0.3s"
            attributeName="opacity"
            calcMode="spline"
            dur="0.7s"
            values="0.4;1;0.4"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
          <animate
            begin="dot1.begin+0.3s"
            attributeName="r"
            calcMode="spline"
            dur="0.7s"
            values="3;4;3"
            keySplines=".45,.05,.55,.95;.45,.05,.55,.95"
          />
        </circle>
      </svg>
    </div>
  );
}
