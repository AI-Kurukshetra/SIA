import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>Not found</h1>
        <p>The page or record you requested does not exist in this workspace.</p>
        <Link href="/" className="button button--primary">
          Go home
        </Link>
      </section>
    </main>
  );
}
