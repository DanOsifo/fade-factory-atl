import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Save, LogOut, KeyRound } from "lucide-react";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type BarberHours = {
  barberId: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type BarberProfile = {
  id: number;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  accentColor: string;
  walkInsOpen: boolean;
  hours: BarberHours[];
};

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers as Record<string, string> ?? {}) },
    ...opts,
  });
  if (res.status === 401) {
    window.location.href = `/login?expired=1&redirect=${encodeURIComponent(window.location.pathname)}`;
  }
  return res;
}

export default function BarberDashboard() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [hours, setHours] = useState<BarberHours[]>([]);
  const [walkInsOpen, setWalkInsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    apiFetch("/auth/me").then((r) => {
      if (!r.ok) { navigate("/login"); return; }
      r.json().then((u: { role: string }) => {
        if (u.role !== "barber") navigate("/admin");
      });
    });
    loadProfile();
  }, []);

  async function loadProfile() {
    const r = await apiFetch("/barber/me");
    if (!r.ok) { navigate("/login"); return; }
    const data = await r.json() as BarberProfile;
    setProfile(data);
    setWalkInsOpen(data.walkInsOpen);

    const map = new Map(data.hours.map((h) => [h.dayOfWeek, h]));
    setHours(
      DAY_LABELS.map((_, i) =>
        map.get(i) ?? { barberId: data.id, dayOfWeek: i, openTime: "09:00", closeTime: "18:00", isClosed: i === 0 }
      )
    );
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveHours() {
    setSaving(true);
    const r = await apiFetch("/barber/hours", { method: "PUT", body: JSON.stringify(hours) });
    setSaving(false);
    showToast(r.ok ? "Hours saved!" : "Error saving hours");
  }

  async function toggleWalkIns() {
    const next = !walkInsOpen;
    setWalkInsOpen(next);
    const r = await apiFetch("/barber/walk-ins", { method: "PUT", body: JSON.stringify({ walkInsOpen: next }) });
    if (!r.ok) setWalkInsOpen(!next);
    else showToast(next ? "Walk-ins open!" : "Walk-ins closed");
  }

  async function changePassword() {
    setPwError("");
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    const r = await apiFetch("/barber/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    setPwSaving(false);
    if (r.ok) {
      showToast("Password changed!");
      setPwForm({ current: "", next: "", confirm: "" });
    } else {
      const data = await r.json() as { error?: string };
      setPwError(data.error ?? "Error changing password");
    }
  }

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    navigate("/");
  }

  const inputCls = "bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-red transition-colors";

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-white font-bold px-6 py-3 rounded-xl shadow-xl text-sm uppercase tracking-widest" style={{ background: profile.accentColor }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {profile.photoUrl && (
            <img src={profile.photoUrl} alt={profile.name} className="w-12 h-12 rounded-full object-cover object-top flex-shrink-0" />
          )}
          <div>
            <h1 className="font-display text-2xl uppercase tracking-widest">{profile.name}</h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest">{profile.title}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs uppercase tracking-widest">
          <LogOut size={15} /> Logout
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Walk-ins Toggle */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm uppercase tracking-widest">Walk-ins</p>
              <p className="text-gray-500 text-xs mt-0.5">Toggle availability for today</p>
            </div>
            <button
              onClick={toggleWalkIns}
              className="relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none"
              style={{ background: walkInsOpen ? profile.accentColor : "rgba(255,255,255,0.1)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: walkInsOpen ? "translateX(28px)" : "translateX(0)" }}
              />
            </button>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: walkInsOpen ? profile.accentColor : "rgb(107 114 128)" }}>
            {walkInsOpen ? "● Accepting walk-ins" : "○ Walk-ins closed"}
          </p>
        </div>

        {/* Hours Editor */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
          <h2 className="font-bold text-sm uppercase tracking-widest mb-4">My Hours</h2>
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-20 text-xs font-bold uppercase tracking-widest text-gray-400 flex-shrink-0">
                  {DAY_LABELS[h.dayOfWeek]?.slice(0, 3)}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, isClosed: e.target.checked };
                      setHours(next);
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-500">Off</span>
                </label>
                {!h.isClosed && (
                  <>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => { const next = [...hours]; next[i] = { ...h, openTime: e.target.value }; setHours(next); }}
                      className={inputCls}
                    />
                    <span className="text-gray-600 text-xs">—</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => { const next = [...hours]; next[i] = { ...h, closeTime: e.target.value }; setHours(next); }}
                      className={inputCls}
                    />
                  </>
                )}
                {h.isClosed && <span className="text-gray-600 text-xs italic">Closed</span>}
              </div>
            ))}
          </div>
          <button
            onClick={saveHours}
            disabled={saving}
            className="mt-5 font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 text-white"
            style={{ background: profile.accentColor }}
          >
            <Save size={13} className="inline mr-1" /> {saving ? "Saving…" : "Save Hours"}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
          <h2 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <KeyRound size={14} /> Change Password
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Current Password</label>
              <input
                type="password"
                className={inputCls + " w-full"}
                value={pwForm.current}
                onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                className={inputCls + " w-full"}
                value={pwForm.next}
                onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                className={inputCls + " w-full"}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            {pwError && (
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{pwError}</p>
            )}
          </div>
          <button
            onClick={changePassword}
            disabled={pwSaving}
            className="mt-4 font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 text-white"
            style={{ background: profile.accentColor }}
          >
            <KeyRound size={13} className="inline mr-1" /> {pwSaving ? "Saving…" : "Update Password"}
          </button>
        </div>

        <p className="text-center text-gray-700 text-xs uppercase tracking-widest">
          Contact admin to update your bio, photo, or specialties.
        </p>
      </div>
    </div>
  );
}
