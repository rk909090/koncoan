"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Username</span>
        <input
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          autoCapitalize="none"
          required
          className="mt-1 h-12 w-full rounded-2xl border-2 border-grape-ink bg-white px-4 text-base outline-none focus:ring-4 focus:ring-lemon"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold tracking-wide text-grape-ink/60 uppercase">Password</span>
        <div className="relative mt-1">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-2xl border-2 border-grape-ink bg-white pr-12 pl-4 text-base outline-none focus:ring-4 focus:ring-lemon"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full hover:bg-lavender"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl border-2 border-chili bg-chili/10 px-4 py-2 text-sm font-semibold text-chili">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-full border-2 border-grape-ink bg-grape font-bold text-white shadow-pop transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        <LogIn className="size-5" />
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
