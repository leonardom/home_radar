import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-2 text-3xl font-bold">404 – Page Not Found</h1>
      <p className="text-muted-foreground mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link href="/" className="text-primary underline">
        Go back home
      </Link>
    </main>
  );
}
