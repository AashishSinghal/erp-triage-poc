import { createContext } from "react"

export type ToastVariant = "default" | "error"

export type Toast = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

export type ToastInput = Omit<Toast, "id">

export type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
