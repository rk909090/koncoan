import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };

async function AlreadyLoggedIn() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="grain relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="absolute -top-40 -right-40 -z-10 size-[520px] rounded-full bg-gradient-to-br from-magenta to-grape-deep opacity-90" />
      <div aria-hidden className="absolute -bottom-32 -left-32 -z-10 size-80 rounded-full bg-lemon/70 blur-3xl" />
      <div aria-hidden className="dots absolute inset-0 -z-20 opacity-70" />

      <Suspense fallback={null}>
        <AlreadyLoggedIn />
      </Suspense>

      <div className="w-full max-w-sm rounded-[28px] border-2 border-grape-ink bg-white p-6 shadow-pop-lg sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-16 w-auto" priority />
          <span className="mt-3 inline-block -rotate-2 rounded-full border-2 border-grape-ink bg-lemon px-3 py-0.5 text-xs font-extrabold">
            Panel Admin & Kasir
          </span>
          <h1 className="mt-4 font-display text-3xl">Masuk dulu, konco!</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
