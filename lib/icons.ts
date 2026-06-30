// Map icon name (string in DB) to lucide-react component
import { Cat, Heart, Star, Gamepad2, Smile, Sun, Cloud, Zap, type LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  cat: Cat,
  heart: Heart,
  star: Star,
  gamepad: Gamepad2,
  smile: Smile,
  sun: Sun,
  cloud: Cloud,
  zap: Zap,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Gamepad2;
}
