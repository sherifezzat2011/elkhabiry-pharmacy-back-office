import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "border-brand-600 bg-brand-500 text-white shadow-sm hover:bg-brand-600",
        variant === "secondary" && "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800",
        variant === "ghost" && "border-transparent bg-transparent text-slate-600 hover:bg-brand-50 hover:text-brand-800",
        variant === "danger" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10 p-0",
        className,
      )}
      {...props}
    />
  );
}
