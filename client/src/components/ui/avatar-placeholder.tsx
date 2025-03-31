import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  size?: "sm" | "md" | "lg";
}

export const AvatarPlaceholder = React.forwardRef<HTMLDivElement, AvatarPlaceholderProps>(
  ({ name = "", size = "md", className, ...props }, ref) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
    ];

    // Determine color based on name (consistent for the same name)
    const colorIndex = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    const backgroundColor = colors[colorIndex];

    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-16 h-16 text-xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center text-white font-medium",
          backgroundColor,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {initials || "?"}
      </div>
    );
  }
);
AvatarPlaceholder.displayName = "AvatarPlaceholder";
