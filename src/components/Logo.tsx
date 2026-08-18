import logoAsset from "@/assets/fitness-infinity-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

/** Brand mark — original artwork, never restyled or stretched. */
export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt="Fitness Infinity logo"
      width={size}
      height={size}
      className={cn("rounded-xl object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
