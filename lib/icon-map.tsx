import {
  FolderKanban,
  Users,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Building2,
  ClipboardList,
  HeartPulse,
  FlaskConical,
  Briefcase,
  Archive,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  FolderKanban,
  Users,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Building2,
  ClipboardList,
  HeartPulse,
  FlaskConical,
  Briefcase,
  Archive,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function DeptIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_REGISTRY[name] ?? FolderKanban;
  return <Icon className={className} />;
}
