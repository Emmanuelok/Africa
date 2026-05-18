import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Compass, Target, Users2, Globe2, Sparkles } from "lucide-react";

export const metadata = { title: "About — Sokoni" };

const VALUES = [
  {
    icon: Target,
    title: "SME-first, always",
    body: "We build for the cooperative shipping 1,500kg of coffee, not the multinational. If the product doesn't work on a phone in Nyeri, it doesn't ship."
  },
  {
    icon: Globe2,
    title: "Continental by design",
    body: "Anglophone, francophone, lusophone, arabophone — Africa is multilingual by default. So is Sokoni."
  },
  {
    icon: Sparkles,
    title: "Truth over hype",
    body: "Trade compliance is not a place for vibes. Every output cites the rule that produced it. Every classification surfaces confidence."
  },
  {
    icon: Users2,
    title: "Open to the rails",
    body: "PAPSS, PACM, ADAPT — public infrastructure is the foundation. We build the SME-facing application layer, not a closed garden."
  }
];

const PARTNERS = [
  "Afreximbank ADAPT",
  "AfCFTA Secretariat",
  "Kenya National Trade Coordinator",
  "Nigeria AfCFTA Office",
  "Ghana Chamber of Commerce",
  "East African Business Council",
  "ECOWAS Trade Liberalisation Scheme",
  "tralac"
];

export default function AboutPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="terracotta">About Sokoni</Badge>
        <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
          Africa trades with the world more than it trades with itself. We&apos;re changing that.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-ink-700">
          Sokoni is the open trade platform for the AfCFTA market. We started with the single most
          painful workflow — figuring out whether your goods qualify for AfCFTA preferential tariffs
          — and we&apos;re building outward from there.
        </p>

        {/* Mission */}
        <section className="mt-16">
          <Card className="bg-ink-950 text-white">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <Badge tone="terracotta" className="bg-terracotta-900/40 text-terracotta-200">
                  Mission
                </Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
                  Triple intra-African trade by 2035.
                </h2>
                <p className="mt-3 text-ink-200">
                  Africa trades 16% within itself today. The AfCFTA target is 50%. The hardware of
                  rails, ports, and policy is being built. We&apos;re building the software layer
                  that makes them actually usable for the 50 million SMEs the AU expects to
                  participate.
                </p>
              </div>
              <Compass className="hidden h-20 w-20 text-terracotta-400 md:block" />
            </div>
          </Card>
        </section>

        {/* Values */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">What we believe</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="lift">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-ink-700">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">The team</h2>
          <p className="mt-2 text-ink-700">Founding team. We&apos;re hiring across product, design, compliance, and infrastructure.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Person
              name="Founding team"
              role="Customs & trade compliance"
              bio="A senior trade-compliance specialist with hands-on AfCFTA implementation experience across West and East Africa."
            />
            <Person
              name="Founding team"
              role="Engineering & AI"
              bio="Python + AI background. Built classification systems handling tens of millions of HS lookups per month at a previous startup."
            />
            <Person
              name="Founding team"
              role="Design & SME GTM"
              bio="Worked alongside cooperatives in Kenya, Ghana, and Côte d'Ivoire on financial inclusion product design."
            />
          </div>
          <p className="mt-4 text-sm text-ink-500">
            Open roles? See <Link href="/contact" className="text-terracotta-700 hover:underline">contact</Link> — we&apos;re recruiting quietly while we close the seed round.
          </p>
        </section>

        {/* Partners */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Aligned with</h2>
          <p className="mt-2 text-ink-700">Institutional collaborators in conversation or pilot. Logo wall fills in as design partnerships close.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {PARTNERS.map((p) => (
              <div
                key={p}
                className="rounded-xl border border-dashed border-ink-300 bg-white px-4 py-3 text-center text-sm text-ink-700"
              >
                {p}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-2xl bg-ink-950 px-6 py-12 text-center text-white md:px-12">
          <h2 className="font-display text-3xl font-semibold">Build it with us.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-200">
            We onboard new design-partner SMEs every two weeks. If you ship under the AfCFTA — or
            wish you could — we want to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/signup" size="lg">Join the waitlist</Button>
            <Button href="/contact" size="lg" variant="outline" className="border-ink-700 bg-transparent text-white hover:bg-ink-900">
              Get in touch
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Person({ name, role, bio }: { name: string; role: string; bio: string }) {
  return (
    <Card>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-terracotta-100 text-lg font-semibold text-terracotta-700">
        {name.charAt(0)}
      </div>
      <div className="mt-3 font-semibold">{name}</div>
      <div className="text-xs uppercase tracking-wide text-ink-500">{role}</div>
      <p className="mt-2 text-sm text-ink-700">{bio}</p>
    </Card>
  );
}
