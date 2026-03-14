"use client";

import { useActionState } from "react";

import { continueToDemo, requestMagicLink } from "@/app/sign-in/actions";

const initialState = {
  error: undefined,
  success: undefined
};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);

  return (
    <div className="form-grid">
      <form action={formAction} className="form-grid">
        <div className="input-group">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <button className="button button--primary" type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {state.error ? <div className="notice">{state.error}</div> : null}
      {state.success ? <div className="notice">{state.success}</div> : null}

      <form action={continueToDemo}>
        <button className="button button--ghost" type="submit">
          Continue in demo mode
        </button>
      </form>
    </div>
  );
}
