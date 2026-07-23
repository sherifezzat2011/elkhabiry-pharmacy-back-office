import { useState } from "react";
import elkhabiryLogo from "@/assets/branding/elkhabiry-logo.png";
import elkhabiryLogoMark from "@/assets/branding/elkhabiry-logo-mark.png";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  imageClassName?: string;
};

const logoByVariant = {
  full: elkhabiryLogo,
  mark: elkhabiryLogoMark,
};

export function BrandLogo({ variant = "full", className, imageClassName }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={cn("inline-flex items-center justify-center overflow-hidden", className)}>
      {failed ? (
        <span className="grid h-full w-full place-items-center rounded-lg border border-brand-100 bg-brand-50 text-sm font-extrabold text-brand-800" aria-label="El Khabiry Pharmacy">
          EK
        </span>
      ) : (
        <img
          src={logoByVariant[variant]}
          alt="El Khabiry Pharmacy"
          className={cn("sidebar-logo h-full w-full object-contain", imageClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
