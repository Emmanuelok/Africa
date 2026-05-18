import Link from "next/link";
import { Mail, MessageSquare, Headphones, Globe2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata = { title: "Contact — Sokoni" };

const ROUTES = [
  { icon: Mail, label: "General", email: "hello@sokoni.africa", desc: "Anything we haven't routed below." },
  { icon: Headphones, label: "Support", email: "support@sokoni.africa", desc: "Bug reports, account issues. Reply within 24h on free, 4h on paid tiers." },
  { icon: MessageSquare, label: "Sales", email: "sales@sokoni.africa", desc: "Forwarder and enterprise pricing, design partnerships." },
  { icon: Globe2, label: "Press", email: "press@sokoni.africa", desc: "Journalists, analysts, AfCFTA-related interviews." }
];

export default function ContactPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="terracotta">Contact</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          Get in touch.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-700">
          We&apos;re a small team building Sokoni in public. The fastest way to reach the right
          person is to pick the right inbox.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ROUTES.map(({ icon: Icon, label, email, desc }) => (
            <Card key={email} className="lift">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-xs uppercase tracking-wide text-ink-500">{label}</div>
              <a href={`mailto:${email}`} className="mt-1 block text-lg font-semibold text-ink-900 hover:text-terracotta-700">
                {email}
              </a>
              <p className="mt-2 text-sm text-ink-700">{desc}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Visit us</h2>
            <div className="mt-3 flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-5 w-5 text-terracotta-600" />
              <div>
                <div className="font-medium">Nairobi, Kenya</div>
                <div className="text-ink-600">Workshop17, Westlands<br />By appointment only</div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-5 w-5 text-terracotta-600" />
              <div>
                <div className="font-medium">Lagos, Nigeria</div>
                <div className="text-ink-600">CcHub, Yaba<br />By appointment only</div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Or join the waitlist</h2>
            <p className="mt-1 text-sm text-ink-600">
              Faster than email if you&apos;re an SME exporter. We onboard new cohorts every two weeks.
            </p>
            <div className="mt-4">
              <WaitlistForm source="contact" />
            </div>
          </Card>
        </div>

        <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-6 text-sm text-ink-700">
          <strong className="text-ink-900">Security disclosures:</strong>{" "}
          <a href="mailto:security@sokoni.africa" className="text-terracotta-700 hover:underline">
            security@sokoni.africa
          </a>{" "}
          · see{" "}
          <Link href="/security" className="text-terracotta-700 hover:underline">
            /security
          </Link>{" "}
          for the full disclosure programme.
          <br />
          <strong className="text-ink-900">Data subject requests:</strong>{" "}
          <a href="mailto:dpo@sokoni.africa" className="text-terracotta-700 hover:underline">
            dpo@sokoni.africa
          </a>{" "}
          · see our{" "}
          <Link href="/privacy" className="text-terracotta-700 hover:underline">
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
}
