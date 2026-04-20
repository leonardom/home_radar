{
  /* Testimonial Section */
}
<section className="mx-auto mb-24 w-full max-w-4xl px-2">
  <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
    What Our Users Say
  </h2>
  <div className="grid gap-8 md:grid-cols-3">
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <p className="mb-4 italic">
        “HomeRadar found us our dream home in days. The instant alerts are a
        game changer!”
      </p>
      <span className="font-semibold">Sarah & Tom</span>
      <span className="text-muted-foreground text-xs">First-time buyers</span>
    </div>
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <p className="mb-4 italic">
        “I saved hours every week. The filters and aggregation are so powerful!”
      </p>
      <span className="font-semibold">Priya S.</span>
      <span className="text-muted-foreground text-xs">Busy professional</span>
    </div>
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <p className="mb-4 italic">
        “I never miss a listing now. The Pro plan is worth every penny.”
      </p>
      <span className="font-semibold">Alex R.</span>
      <span className="text-muted-foreground text-xs">Investor</span>
    </div>
  </div>
</section>;

{
  /* FAQ Section */
}
<section className="mx-auto mb-24 w-full max-w-3xl px-2">
  <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
    Frequently Asked Questions
  </h2>
  <div className="space-y-6">
    <div>
      <h3 className="mb-1 text-lg font-semibold">
        How do instant alerts work?
      </h3>
      <p className="text-muted-foreground">
        Set your filters and we’ll notify you by email as soon as a matching
        property is listed.
      </p>
    </div>
    <div>
      <h3 className="mb-1 text-lg font-semibold">
        What’s included in the Free plan?
      </h3>
      <p className="text-muted-foreground">
        You get 1 active filter, instant alerts, and can save up to 10
        properties—no credit card required.
      </p>
    </div>
    <div>
      <h3 className="mb-1 text-lg font-semibold">
        Can I cancel or change my plan?
      </h3>
      <p className="text-muted-foreground">
        Yes, you can upgrade, downgrade, or cancel anytime from your account
        dashboard.
      </p>
    </div>
    <div>
      <h3 className="mb-1 text-lg font-semibold">Is my data secure?</h3>
      <p className="text-muted-foreground">
        Absolutely. We use industry-standard security and never share your data
        without consent.
      </p>
    </div>
  </div>
</section>;

{
  /* Footer */
}
<footer className="bg-muted mt-12 w-full border-t py-8">
  <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 text-sm md:flex-row">
    <div className="font-bold">HomeRadar</div>
    <nav className="flex gap-6">
      <Link href="#" className="hover:underline">
        Privacy Policy
      </Link>
      <Link href="#" className="hover:underline">
        Terms
      </Link>
      <Link href="#" className="hover:underline">
        Contact
      </Link>
    </nav>
    <div className="text-muted-foreground">
      &copy; {new Date().getFullYear()} HomeRadar
    </div>
  </div>
</footer>;
{
  /* Pricing Section */
}
<section id="pricing" className="mx-auto mb-24 w-full max-w-3xl px-2">
  <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">Pricing</h2>
  <div className="grid gap-8 md:grid-cols-2">
    <div className="bg-card flex flex-col items-center rounded-xl border p-8 text-center shadow-sm">
      <h3 className="mb-2 text-xl font-semibold">Free</h3>
      <div className="mb-2 text-4xl font-bold">$0</div>
      <ul className="text-muted-foreground mb-6 space-y-2 text-sm">
        <li>• 1 active filter</li>
        <li>• Instant property alerts</li>
        <li>• Save up to 10 properties</li>
        <li>• Email support</li>
      </ul>
      <Button asChild className="w-full" size="lg">
        <Link href="/(auth)/sign-up">Get Started</Link>
      </Button>
    </div>
    <div className="border-primary bg-card relative flex flex-col items-center rounded-xl border-2 p-8 text-center shadow-lg">
      <span className="bg-primary text-primary-foreground absolute -top-5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold shadow">
        Pro
      </span>
      <h3 className="mt-4 mb-2 text-xl font-semibold">Pro</h3>
      <div className="mb-2 text-4xl font-bold">
        $9<span className="text-lg font-medium">/mo</span>
      </div>
      <ul className="text-muted-foreground mb-6 space-y-2 text-sm">
        <li>• Unlimited filters</li>
        <li>• Priority instant alerts</li>
        <li>• Unlimited saved properties</li>
        <li>• Priority support</li>
      </ul>
      <Button asChild className="w-full" size="lg" variant="outline">
        <Link href="/(auth)/sign-up">Start Free Trial</Link>
      </Button>
    </div>
  </div>
</section>;
{
  /* How It Works Section */
}
<section className="mx-auto mb-24 w-full max-w-4xl px-2">
  <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
    How It Works
  </h2>
  <div className="grid gap-8 md:grid-cols-3">
    <div className="flex flex-col items-center text-center">
      <span className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 4v16m8-8H4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">1. Set Your Filters</h3>
      <p className="text-muted-foreground">
        Choose your price, bedrooms, location, and more to define your perfect
        property match.
      </p>
    </div>
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">2. Get Instant Alerts</h3>
      <p className="text-muted-foreground">
        Receive real-time notifications when a matching property is listed—no
        more FOMO.
      </p>
    </div>
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">3. Save & Track</h3>
      <p className="text-muted-foreground">
        Bookmark your favorites and track their status—all in one place.
      </p>
    </div>
  </div>
</section>;
{
  /* Features Section */
}
<section className="mx-auto mb-24 w-full max-w-5xl px-2">
  <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
    Why HomeRadar?
  </h2>
  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <span className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-4v-4m0 0V8m0 4h4m-4 0H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">Instant Alerts</h3>
      <p className="text-muted-foreground">
        Get notified the moment a matching property hits the market—never miss
        out again.
      </p>
    </div>
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">Powerful Filters</h3>
      <p className="text-muted-foreground">
        Zero in on your dream home with price, bedrooms, location, and keyword
        filters.
      </p>
    </div>
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 12h18M12 3v18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">Smart Aggregation</h3>
      <p className="text-muted-foreground">
        See listings from multiple sources in one place—no more endless
        searching.
      </p>
    </div>
    <div className="bg-card flex flex-col items-center rounded-xl border p-6 text-center shadow-sm">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-600">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14l-7-5-7 5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h3 className="mb-2 text-lg font-semibold">Save & Track</h3>
      <p className="text-muted-foreground">
        Bookmark properties you love and track them as their status changes.
      </p>
    </div>
  </div>
</section>;
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-24">
      <section className="mx-auto w-full max-w-3xl space-y-8 text-center">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
            Find Your Perfect Home—Faster.
          </h1>
          <p className="text-muted-foreground mb-8 text-lg md:text-xl">
            HomeRadar delivers instant property alerts, powerful filters, and
            smart matching so you never miss your dream home.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="px-8 py-4 text-lg">
            <Link href="/(auth)/sign-up">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg"
          >
            <Link href="#pricing">See Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Abstract Illustration */}
      <section className="mt-12 mb-20 flex w-full justify-center">
        <svg
          width="480"
          height="180"
          viewBox="0 0 480 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto max-w-full"
          aria-hidden="true"
        >
          <ellipse
            cx="120"
            cy="90"
            rx="100"
            ry="40"
            fill="#6366f1"
            fillOpacity="0.15"
          />
          <ellipse
            cx="360"
            cy="90"
            rx="100"
            ry="40"
            fill="#10b981"
            fillOpacity="0.12"
          />
          <rect
            x="180"
            y="60"
            width="120"
            height="60"
            rx="24"
            fill="#6366f1"
            fillOpacity="0.18"
          />
          <rect
            x="210"
            y="80"
            width="60"
            height="20"
            rx="10"
            fill="#10b981"
            fillOpacity="0.18"
          />
          <circle cx="240" cy="90" r="18" fill="#6366f1" fillOpacity="0.25" />
        </svg>
      </section>
    </main>
  );
}
