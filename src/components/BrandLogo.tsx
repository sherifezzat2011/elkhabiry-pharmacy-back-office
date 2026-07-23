import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  imageClassName?: string;
};

const logoByVariant = {
  full: "/branding/elkhabiry-logo.png",
  mark: "/branding/elkhabiry-logo-mark.png",
};

export function BrandLogo({ variant = "full", className, imageClassName }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center justify-center overflow-hidden", className)}>
      <img
        src={logoByVariant[variant]}
        alt="El Khabiry Pharmacy"
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
