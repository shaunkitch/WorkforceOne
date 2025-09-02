"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant = "default", onClose, ...props }, ref) => {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose?.()
      }, 5000)

      return () => clearTimeout(timer)
    }, [onClose])

    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-4 right-4 z-50 w-full max-w-sm rounded-md border p-4 shadow-lg transition-all animate-in slide-in-from-top-2",
          variant === "default" && "bg-white border-gray-200",
          variant === "destructive" && "bg-red-50 border-red-200"
        )}
        {...props}
      >
        <div className="flex">
          <div className="flex-1">
            {title && (
              <div className={cn(
                "text-sm font-medium",
                variant === "default" && "text-gray-900",
                variant === "destructive" && "text-red-900"
              )}>
                {title}
              </div>
            )}
            {description && (
              <div className={cn(
                "mt-1 text-sm",
                variant === "default" && "text-gray-600",
                variant === "destructive" && "text-red-700"
              )}>
                {description}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              "ml-4 shrink-0 rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400",
              variant === "destructive" && "hover:bg-red-100 focus:ring-red-400"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }