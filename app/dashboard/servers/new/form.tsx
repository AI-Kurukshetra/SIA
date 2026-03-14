"use client";

import { useActionState } from "react";

import type { CreateServerState } from "@/app/dashboard/servers/new/actions";
import { createServerAction } from "@/app/dashboard/servers/new/actions";

const initialState: CreateServerState = {};

export function NewServerForm() {
  const [state, formAction, pending] = useActionState(createServerAction, initialState);

  return (
    <form action={formAction} className="form-grid">
      <div className="two-column-grid">
        <div className="input-group detail-card">
          <label htmlFor="name">Server name</label>
          <input id="name" name="name" placeholder="Billing API" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="hostname">Hostname</label>
          <input id="hostname" name="hostname" placeholder="billing-01.internal" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="provider">Provider</label>
          <input id="provider" name="provider" placeholder="AWS, Hetzner, On-prem" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="environment">Environment</label>
          <select id="environment" name="environment" defaultValue="production">
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div className="input-group detail-card">
          <label htmlFor="region">Region</label>
          <input id="region" name="region" placeholder="ap-south-1" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="osFamily">OS family</label>
          <input id="osFamily" name="osFamily" placeholder="Ubuntu 22.04" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="sshUser">SSH user</label>
          <input id="sshUser" name="sshUser" placeholder="ubuntu" required />
        </div>
        <div className="input-group detail-card">
          <label htmlFor="owner">Owner</label>
          <input id="owner" name="owner" placeholder="Platform Team" required />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="summary">What does this host do?</label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          placeholder="Summarize what this server is expected to handle."
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="tags">Tags</label>
        <input id="tags" name="tags" placeholder="node, payments, redis" />
      </div>

      {state.error ? <div className="notice">{state.error}</div> : null}

      <div className="pill-row">
        <button className="button button--primary" type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create server"}
        </button>
      </div>
    </form>
  );
}
