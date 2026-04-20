import Link from "next/link";
import { ArrowRight, House, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="app-container flex min-h-screen items-center py-20">
      <Card className="border-border/70 w-full shadow-sm">
        <CardHeader className="gap-4">
          <Badge className="w-fit">Frontend Bootstrap Ready</Badge>
          <CardTitle className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            HomeRadar foundation is set up for the next implementation tasks.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Included in FE-1</h2>
            <ul className="text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Radar className="text-primary h-4 w-4" />
                Next.js App Router + TypeScript + Tailwind baseline
              </li>
              <li className="flex items-center gap-2">
                <House className="text-accent h-4 w-4" />
                App-wide providers for Clerk, React Query, and toasts
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="text-primary h-4 w-4" />
                Core component primitives and environment validation
              </li>
            </ul>
          </section>

          <section className="border-border/70 bg-card space-y-4 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Continue by implementing FE-2 onward in TASKS.md.
            </p>
            <Button asChild>
              <Link href="/">Start FE-2 Design System</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
