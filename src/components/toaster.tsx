"use client"

import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <div key={id}>
            {title && <div>{title}</div>}
            {description && <div>{description}</div>}
          </div>
        )
      })}
    </>
  )
}
