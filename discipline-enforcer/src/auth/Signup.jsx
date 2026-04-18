import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function Signup({ onSwitch }) {
  const { signup }              = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords don't match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signup(email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="font-display text-6xl text-white tracking-widest mb-1">
            DISCIPLINE
          </h1>
          <p className="font-mono text-brand-muted text-xs tracking-widest uppercase">
            Create your account
          </p>
        </div>

        <div className="bg-brand-panel border border-brand-border rounded-lg p-8">
          <h2 className="font-mono text-brand-text text-sm tracking-widest uppercase mb-6">
            // REGISTER
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block font-mono text-brand-muted text-xs mb-1 tracking-wider">EMAIL</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-black border border-brand-border text-white font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-brand-red transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block font-mono text-brand-muted text-xs mb-1 tracking-wider">PASSWORD</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-black border border-brand-border text-white font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-brand-red transition-colors"
                placeholder="min 6 characters"
              />
            </div>

            <div>
              <label className="block font-mono text-brand-muted text-xs mb-1 tracking-wider">CONFIRM PASSWORD</label>
              <input
                type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                className="w-full bg-black border border-brand-border text-white font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-brand-red transition-colors"
                placeholder="repeat password"
              />
            </div>

            {error && (
              <p className="font-mono text-brand-red text-xs border border-brand-red/30 bg-brand-red/10 px-3 py-2 rounded">
                ⚠ {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-red text-white font-display text-xl tracking-widest py-3 rounded hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "CREATING..." : "COMMIT"}
            </button>
          </form>

          <p className="font-mono text-brand-muted text-xs text-center mt-6">
            Have account?{" "}
            <button onClick={onSwitch} className="text-brand-red hover:text-red-400 transition-colors">
              Sign in →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
