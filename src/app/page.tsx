const features = [
  {
    title: "AI Lead Scoring",
    description:
      "Prioritize every inquiry with instant intent signals, fit scoring, and revenue potential.",
  },
  {
    title: "AI Follow-Up",
    description:
      "Send perfectly timed, personalized follow-ups before warm prospects drift away.",
  },
  {
    title: "WhatsApp Integration",
    description:
      "Capture, qualify, and re-engage leads directly inside the channel your buyers already use.",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Track every recovered lead, response, and won deal from one clean command center.",
  },
];

const stats = [
  { value: "42K+", label: "Leads Recovered" },
  { value: "68%", label: "Response Rate" },
  { value: "31%", label: "Revenue Growth" },
];

const testimonials = [
  {
    quote:
      "LeadPilot AI brought back deals we thought were gone. Our reps now focus on the leads most likely to close.",
    name: "Maya Chen",
    role: "VP Sales, CloudNest",
  },
  {
    quote:
      "The WhatsApp follow-up flows paid for themselves in the first month. It feels like adding another SDR.",
    name: "Arjun Mehta",
    role: "Founder, ScaleDesk",
  },
  {
    quote:
      "We finally have a clear view of which campaigns recover revenue and which leads need attention now.",
    name: "Sofia Ramirez",
    role: "Growth Lead, Revora",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    description: "For small teams capturing and qualifying inbound leads.",
    features: ["1,000 leads/month", "AI scoring", "Email follow-up", "Basic analytics"],
  },
  {
    name: "Growth",
    price: "$149",
    description: "For sales teams ready to recover more pipeline at scale.",
    features: [
      "10,000 leads/month",
      "WhatsApp integration",
      "Advanced automation",
      "Revenue dashboard",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For high-volume teams with custom workflows and reporting.",
    features: ["Unlimited leads", "Custom integrations", "SLA support", "Dedicated success"],
  },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="LeadPilot AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-lg font-black text-black">
            LP
          </span>
          <span className="text-lg font-bold tracking-tight text-white">LeadPilot AI</span>
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
          <a className="transition hover:text-orange-400" href="#features">
            Features
          </a>
          <a className="transition hover:text-orange-400" href="#pricing">
            Pricing
          </a>
          <a className="transition hover:text-orange-400" href="#contact">
            Contact
          </a>
        </div>

        <a
          href="/login"
          className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
        >
          Login
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.34),_transparent_34%),linear-gradient(135deg,_#050505_0%,_#111827_46%,_#231006_100%)]">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
            AI-powered lead recovery for modern sales teams
          </p>
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Never Lose A Lead Again
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
            LeadPilot AI scores every prospect, follows up automatically, and brings missed
            opportunities back into your pipeline before they go cold.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="/signup"
              className="rounded-lg bg-orange-500 px-6 py-4 text-center text-sm font-bold text-black shadow-[0_0_35px_rgba(249,115,22,0.35)] transition hover:bg-orange-400"
            >
              Start Recovering Leads
            </a>
            <a
              href="#features"
              className="rounded-lg border border-white/15 px-6 py-4 text-center text-sm font-bold text-white transition hover:border-orange-500/70 hover:text-orange-300"
            >
              Explore Features
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="rounded-xl border border-white/10 bg-black/70 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Live Recovery Queue</p>
                <p className="text-2xl font-bold text-white">$128,400</p>
              </div>
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-300">
                +31%
              </span>
            </div>
            <div className="space-y-3">
              {["High intent demo request", "Missed WhatsApp reply", "Pricing page revisit"].map(
                (item, index) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    key={item}
                  >
                    <div>
                      <p className="font-semibold text-white">{item}</p>
                      <p className="text-sm text-zinc-400">AI follow-up scheduled</p>
                    </div>
                    <span className="text-sm font-bold text-orange-400">
                      {96 - index * 7}%
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-black px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">
            Built to recover revenue automatically
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              className="rounded-xl border border-white/10 bg-zinc-950 p-6 transition hover:border-orange-500/50 hover:bg-zinc-900"
              key={feature.title}
            >
              <div className="mb-5 h-2 w-12 rounded-full bg-orange-500" />
              <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              <p className="mt-4 leading-7 text-zinc-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-white/10 bg-zinc-950 px-6 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div className="text-center" key={stat.label}>
            <p className="text-5xl font-black text-orange-500">{stat.value}</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-black px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black text-white sm:text-5xl">Trusted by revenue teams</h2>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              className="rounded-xl border border-white/10 bg-zinc-950 p-6"
              key={testimonial.name}
            >
              <blockquote className="leading-8 text-zinc-300">
                &quot;{testimonial.quote}&quot;
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-bold text-white">{testimonial.name}</p>
                <p className="text-sm text-orange-300">{testimonial.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-zinc-950 px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">
            Choose your recovery engine
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              className={`rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-orange-500 bg-orange-500 text-black shadow-[0_0_45px_rgba(249,115,22,0.22)]"
                  : "border-white/10 bg-black text-white"
              }`}
              key={plan.name}
            >
              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className={`mt-3 leading-7 ${plan.highlighted ? "text-black/70" : "text-zinc-400"}`}>
                {plan.description}
              </p>
              <p className="mt-8 text-5xl font-black">
                {plan.price}
                {plan.price !== "Custom" && <span className="text-base font-bold">/mo</span>}
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-3" key={feature}>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        plan.highlighted ? "bg-black" : "bg-orange-500"
                      }`}
                    />
                    <span className={plan.highlighted ? "text-black/80" : "text-zinc-300"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className={`mt-8 block rounded-lg px-5 py-3 text-center text-sm font-bold transition ${
                  plan.highlighted
                    ? "bg-black text-white hover:bg-zinc-900"
                    : "bg-white text-black hover:bg-orange-500"
                }`}
              >
                Get Started
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-black px-6 py-10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold text-white">LeadPilot AI</p>
          <p className="mt-2 text-sm text-zinc-400">Recover more leads. Close more revenue.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-medium text-zinc-400">
          <a className="hover:text-orange-400" href="#features">
            Features
          </a>
          <a className="hover:text-orange-400" href="#pricing">
            Pricing
          </a>
          <a className="hover:text-orange-400" href="mailto:hello@leadpilot.ai">
            hello@leadpilot.ai
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}


