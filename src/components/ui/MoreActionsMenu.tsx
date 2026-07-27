import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type MenuPosition = {
  top: number;
  left: number;
};

export function MoreActionsMenu({ actions, label = "More Actions", align = "right" }: { actions: MenuAction[]; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 192;
    const estimatedHeight = Math.max(48, actions.length * 40 + 12);
    const below = rect.bottom + 8;
    const top = below + estimatedHeight > window.innerHeight ? Math.max(12, rect.top - estimatedHeight - 8) : below;
    const left = align === "right" ? rect.right - menuWidth : rect.left;
    setPosition({
      top,
      left: Math.min(Math.max(12, left), window.innerWidth - menuWidth - 12),
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, actions.length]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-transparent text-slate-600 transition hover:bg-brand-50 hover:text-brand-800"
        aria-label={label}
        title={label}
        onClick={() => {
          updatePosition();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-48 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-soft"
          style={{ top: position.top, left: position.left }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={cn("w-full rounded-md px-3 py-2 text-left hover:bg-brand-50", action.danger && "text-red-700 hover:bg-red-50")}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </>
  );
}
