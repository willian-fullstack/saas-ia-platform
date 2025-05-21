import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  color?: string
}

export function LoadingDots({ 
  className, 
  size = "md", 
  color = "bg-current", 
  ...props 
}: LoadingDotsProps) {
  const sizeClass = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }[size]

  return (
    <div className={cn("flex items-center space-x-1", className)} {...props}>
      <div className={cn("animate-bounce", sizeClass, color, "rounded-full")} />
      <div className={cn("animate-bounce delay-75", sizeClass, color, "rounded-full")} />
      <div className={cn("animate-bounce delay-150", sizeClass, color, "rounded-full")} />
    </div>
  )
} 