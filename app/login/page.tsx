import Navbar from "@/components/Navbar";
import AuthForm from "@/components/Authform";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
            Welcome Back
          </p>

          <h1 className="text-4xl font-bold">Login</h1>

          <p className="mt-3 text-zinc-400">
            Access your CreatorOS AI dashboard and continue building your
            creator business.
          </p>

          <div className="mt-8">
            <AuthForm mode="login" />
          </div>
        </div>
      </section>
    </main>
  );
}