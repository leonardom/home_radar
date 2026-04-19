import Link from "next/link";

export default function Home() {
  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">Simple MVP</p>
        <h1>Track your next home without losing signal.</h1>
        <p>
          This frontend includes the core MVP flows: login/register, dashboard
          insights, filter settings, and saved listings.
        </p>
      </section>

      <section className="grid two-col">
        <Link className="card-link" href="/auth">
          <h2>Login/Register</h2>
          <p>Sign in or create an account to start receiving matches.</p>
        </Link>
        <Link className="card-link" href="/dashboard">
          <h2>Dashboard</h2>
          <p>Check notifications, match activity, and quick status metrics.</p>
        </Link>
        <Link className="card-link" href="/filters">
          <h2>Filter settings</h2>
          <p>Create and adjust your search profile in one place.</p>
        </Link>
        <Link className="card-link" href="/saved-listings">
          <h2>Saved listings</h2>
          <p>Review and manage bookmarked properties.</p>
        </Link>
      </section>
    </div>
  );
}
