// Resolves the string icon names stored on agent templates
// (lib/agents/catalogue.ts) to their lucide-react components, so the catalogue
// can declare icons declaratively without importing React.
import {
  Wand2,
  Activity,
  ShieldCheck,
  Compass,
  Calendar,
  Bot,
  type LucideIcon
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Wand2,
  Activity,
  ShieldCheck,
  Compass,
  Calendar,
  Bot
};

export function agentIcon(name: string | null | undefined): LucideIcon {
  return (name && MAP[name]) || Bot;
}
