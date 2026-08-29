import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Scissors, Clock, AlignLeft, Image, Users, LogOut, ChevronDown, X, Plus, Trash2, Save, Upload } from "lucide-react";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ACCENT_COLORS = [
  { label: "Red", value: "#DB2100" },
  { label: "Blue", value: "#0000EE" },
  { label: "Yellow", value: "#FCFF66" },
  { label: "White", value: "#FFFFFF" },
];

type Barber = {
  id: number;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  specialties: string[];
  accentColor: string;
  active: boolean;
  sortOrder: number;
  walkInsOpen: boolean;
};

type BarberHours = {
  id?: number;
  barberId: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type GalleryImage = {
  id: number;
  slot: number;
  url: string;
  alt: string;
};

type DBUser = {
  id: number;
  username: string;
  role: "barber" | "admin";
  barberId: number | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
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

function makeDefaultHours(barberId: number): BarberHours[] {
  return DAY_LABELS.map((_, i) => ({
    barberId,
    dayOfWeek: i,
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: i === 0,
  }));
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"barbers" | "hours" | "bio" | "gallery" | "users">("barbers");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [editingBarber, setEditingBarber] = useState<Partial<Barber> | null>(null);
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [hoursBarber, setHoursBarber] = useState<number | null>(null);
  const [hours, setHours] = useState<BarberHours[]>([]);
  const [bio, setBio] = useState("");
  const [gallery, setGallery] = useState<(GalleryImage | null)[]>(Array(12).fill(null));
  const [users, setUsers] = useState<DBUser[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "barber" as "barber" | "admin", barberId: "" });
  const [resetPwUserId, setResetPwUserId] = useState<number | null>(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/auth/me").then((r) => {
      if (!r.ok) { navigate("/login"); return; }
      r.json().then((u: { role: string }) => {
        if (u.role !== "admin") navigate("/barber");
      });
    });
    loadBarbers();
    loadBio();
    loadGallery();
    loadUsers();
  }, []);

  async function loadBarbers() {
    const r = await apiFetch("/admin/barbers");
    if (r.ok) setBarbers(await r.json() as Barber[]);
  }

  async function loadBio() {
    const r = await apiFetch("/site-content/about");
    if (r.ok) {
      const data = await r.json() as { value: string };
      setBio(data.value);
    }
  }

  async function loadGallery() {
    const r = await apiFetch("/admin/gallery");
    if (r.ok) {
      const imgs = await r.json() as GalleryImage[];
      const arr: (GalleryImage | null)[] = Array(12).fill(null);
      imgs.forEach((img) => { if (img.slot >= 1 && img.slot <= 12) arr[img.slot - 1] = img; });
      setGallery(arr);
    }
  }

  async function loadUsers() {
    const r = await apiFetch("/admin/users");
    if (r.ok) setUsers(await r.json() as DBUser[]);
  }

  async function loadHours(barberId: number) {
    const r = await apiFetch(`/admin/barbers/${barberId}/hours`);
    if (r.ok) {
      const data = await r.json() as BarberHours[];
      const map = new Map(data.map((h) => [h.dayOfWeek, h]));
      setHours(
        DAY_LABELS.map((_, i) => map.get(i) ?? { barberId, dayOfWeek: i, openTime: "09:00", closeTime: "18:00", isClosed: i === 0 })
      );
    } else {
      setHours(makeDefaultHours(barberId));
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function uploadFileToStorage(file: File): Promise<string> {
    const metaRes = await apiFetch("/storage/uploads/request-url", {
      method: "POST",
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    if (!metaRes.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, objectPath } = await metaRes.json() as { uploadURL: string; objectPath: string };
    const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadRes.ok) throw new Error("File upload failed");
    return `/api/storage${objectPath}`;
  }

  async function handleBarberPhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photoUrl = await uploadFileToStorage(file);
      setEditingBarber((prev) => prev ? { ...prev, photoUrl } : prev);
    } catch {
      showToast("Error uploading photo");
    }
  }

  async function saveBarber() {
    if (!editingBarber) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: editingBarber.name,
      title: editingBarber.title,
      bio: editingBarber.bio,
      photoUrl: editingBarber.photoUrl,
      specialties: editingBarber.specialties,
      accentColor: editingBarber.accentColor,
      active: editingBarber.active ?? true,
      sortOrder: editingBarber.sortOrder ?? 0,
    };

    let r: Response;
    if (isAddingBarber) {
      r = await apiFetch("/admin/barbers", { method: "POST", body: JSON.stringify(body) });
    } else {
      r = await apiFetch(`/admin/barbers/${editingBarber.id}`, { method: "PUT", body: JSON.stringify(body) });
    }
    if (r.ok) {
      showToast("Barber saved!");
      setEditingBarber(null);
      setIsAddingBarber(false);
      await loadBarbers();
    } else {
      showToast("Error saving barber");
    }
    setSaving(false);
  }

  async function deleteBarber(id: number) {
    if (!confirm("Delete this barber? This cannot be undone.")) return;
    await apiFetch(`/admin/barbers/${id}`, { method: "DELETE" });
    showToast("Barber deleted");
    await loadBarbers();
  }

  async function saveHours() {
    if (!hoursBarber) return;
    setSaving(true);
    const r = await apiFetch(`/admin/barbers/${hoursBarber}/hours`, {
      method: "PUT",
      body: JSON.stringify(hours),
    });
    setSaving(false);
    showToast(r.ok ? "Hours saved!" : "Error saving hours");
  }

  async function saveBio() {
    setSaving(true);
    const r = await apiFetch("/admin/content/about", { method: "PUT", body: JSON.stringify({ value: bio }) });
    setSaving(false);
    showToast(r.ok ? "Bio saved!" : "Error saving bio");
  }

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>, slot: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slot);
    try {
      const url = await uploadFileToStorage(file);
      const r = await apiFetch(`/admin/gallery/${slot}`, {
        method: "PUT",
        body: JSON.stringify({ url }),
      });
      if (r.ok) { showToast(`Slot ${slot} updated!`); await loadGallery(); }
      else showToast("Error saving gallery slot");
    } catch {
      showToast("Error uploading image");
    }
    setUploadingSlot(null);
    e.target.value = "";
  }

  async function clearGallerySlot(slot: number) {
    await apiFetch(`/admin/gallery/${slot}`, { method: "DELETE" });
    await loadGallery();
    showToast(`Slot ${slot} cleared`);
  }

  async function saveNewUser() {
    if (!newUser.username || !newUser.password) return;
    setSaving(true);
    const r = await apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        barberId: newUser.barberId ? Number(newUser.barberId) : undefined,
      }),
    });
    setSaving(false);
    if (r.ok) {
      showToast("User created!");
      setNewUser({ username: "", password: "", role: "barber", barberId: "" });
      await loadUsers();
    } else {
      showToast("Error creating user");
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user?")) return;
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    await loadUsers();
    showToast("User deleted");
  }

  async function unlockUser(id: number) {
    const r = await apiFetch(`/admin/users/${id}/unlock`, { method: "POST" });
    if (r.ok) {
      showToast("Account unlocked!");
      await loadUsers();
    } else {
      showToast("Error unlocking account");
    }
  }

  function isUserLocked(u: DBUser): boolean {
    return !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
  }

  async function resetUserPassword(id: number) {
    if (!resetPwValue || resetPwValue.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    const r = await apiFetch(`/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password: resetPwValue }),
    });
    if (r.ok) {
      showToast("Password reset!");
      setResetPwUserId(null);
      setResetPwValue("");
    } else {
      showToast("Error resetting password");
    }
  }

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    navigate("/");
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-red transition-colors";
  const labelCls = "block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1";
  const btnCls = "bg-accent-red text-white font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-50";

  const TABS = [
    { key: "barbers", label: "Barbers", icon: <Scissors size={16} /> },
    { key: "hours", label: "Hours", icon: <Clock size={16} /> },
    { key: "bio", label: "Bio", icon: <AlignLeft size={16} /> },
    { key: "gallery", label: "Gallery", icon: <Image size={16} /> },
    { key: "users", label: "Users", icon: <Users size={16} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-accent-red text-white font-bold px-6 py-3 rounded-xl shadow-xl text-sm uppercase tracking-widest">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest">Admin Portal</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Fade Factory ATL</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs uppercase tracking-widest">
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${tab === t.key ? "border-accent-red text-white" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── BARBERS TAB ── */}
        {tab === "barbers" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl uppercase tracking-widest">Barbers</h2>
              <button onClick={() => { setEditingBarber({ accentColor: "#DB2100", active: true, specialties: [] }); setIsAddingBarber(true); }} className={btnCls}>
                <Plus size={13} className="inline mr-1" /> Add Barber
              </button>
            </div>

            {/* Barber list */}
            <div className="space-y-3 mb-6">
              {barbers.map((b) => (
                <div key={b.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  {b.photoUrl && (
                    <img src={b.photoUrl} alt={b.name} className="w-12 h-12 rounded-full object-cover object-top flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm uppercase tracking-wide">{b.name}</p>
                    <p className="text-gray-500 text-xs">{b.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.accentColor }} />
                      <span className="text-xs text-gray-600">{b.active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingBarber(b); setIsAddingBarber(false); }}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-white/20 rounded-lg hover:border-white/60 transition-colors"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteBarber(b.id)} className="text-xs px-3 py-1.5 text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit / Add Form */}
            {editingBarber && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-sm uppercase tracking-widest">{isAddingBarber ? "Add Barber" : "Edit Barber"}</h3>
                  <button onClick={() => { setEditingBarber(null); setIsAddingBarber(false); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input className={inputCls} value={editingBarber.name ?? ""} onChange={(e) => setEditingBarber((p) => ({ ...p, name: e.target.value }))} placeholder="Barber name" />
                  </div>
                  <div>
                    <label className={labelCls}>Title</label>
                    <input className={inputCls} value={editingBarber.title ?? ""} onChange={(e) => setEditingBarber((p) => ({ ...p, title: e.target.value }))} placeholder="Co-Owner & Master Barber" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Bio</label>
                    <textarea className={inputCls + " min-h-[80px] resize-y"} value={editingBarber.bio ?? ""} onChange={(e) => setEditingBarber((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio text..." />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Photo</label>
                    <div className="flex items-center gap-3">
                      {editingBarber.photoUrl && (
                        <img src={editingBarber.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover object-top" />
                      )}
                      <div className="flex-1">
                        <input className={inputCls} value={(editingBarber as Record<string, unknown>)["photoBase64"] ? "(file selected)" : (editingBarber.photoUrl ?? "")} onChange={(e) => setEditingBarber((p) => ({ ...p, photoUrl: e.target.value, photoBase64: undefined }))} placeholder="/akeem-photo.jpg" readOnly={!!(editingBarber as Record<string, unknown>)["photoBase64"]} />
                        <button onClick={() => photoInputRef.current?.click()} className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                          <Upload size={12} /> Upload photo
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleBarberPhotoUpload} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Accent Color</label>
                    <select className={inputCls} value={editingBarber.accentColor ?? "#DB2100"} onChange={(e) => setEditingBarber((p) => ({ ...p, accentColor: e.target.value }))}>
                      {ACCENT_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Specialties (comma-separated)</label>
                    <input className={inputCls} value={(editingBarber.specialties ?? []).join(", ")} onChange={(e) => setEditingBarber((p) => ({ ...p, specialties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} placeholder="Fades, Beard Grooming" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingBarber.active ?? true} onChange={(e) => setEditingBarber((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded" />
                      <span className="text-sm text-gray-300">Active</span>
                    </label>
                  </div>
                  <div>
                    <label className={labelCls}>Sort Order</label>
                    <input type="number" className={inputCls} value={editingBarber.sortOrder ?? 0} onChange={(e) => setEditingBarber((p) => ({ ...p, sortOrder: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={saveBarber} disabled={saving} className={btnCls}>
                    <Save size={13} className="inline mr-1" /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setEditingBarber(null); setIsAddingBarber(false); }} className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 border border-white/20 rounded-lg hover:border-white/60 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HOURS TAB ── */}
        {tab === "hours" && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest mb-6">Barber Hours</h2>
            <div className="mb-5">
              <label className={labelCls}>Select Barber</label>
              <select
                className={inputCls}
                value={hoursBarber ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setHoursBarber(id);
                  loadHours(id);
                }}
              >
                <option value="">— pick a barber —</option>
                {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {hoursBarber && hours.length > 0 && (
              <div>
                <div className="space-y-2 mb-5">
                  {hours.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                      <span className="w-20 text-xs font-bold uppercase tracking-widest text-gray-400 flex-shrink-0">
                        {DAY_LABELS[h.dayOfWeek]}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={h.isClosed}
                          onChange={(e) => {
                            const next = [...hours];
                            next[i] = { ...h, isClosed: e.target.checked };
                            setHours(next);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-400">Closed</span>
                      </label>
                      {!h.isClosed && (
                        <>
                          <input
                            type="time"
                            value={h.openTime}
                            onChange={(e) => { const next = [...hours]; next[i] = { ...h, openTime: e.target.value }; setHours(next); }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-red"
                          />
                          <span className="text-gray-600 text-xs">to</span>
                          <input
                            type="time"
                            value={h.closeTime}
                            onChange={(e) => { const next = [...hours]; next[i] = { ...h, closeTime: e.target.value }; setHours(next); }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-red"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={saveHours} disabled={saving} className={btnCls}>
                  <Save size={13} className="inline mr-1" /> {saving ? "Saving…" : "Save Hours"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── BIO TAB ── */}
        {tab === "bio" && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest mb-6">Shop Bio</h2>
            <p className="text-gray-400 text-sm mb-4">This text appears in the "The Factory" section of the homepage.</p>
            <textarea
              className={inputCls + " min-h-[180px] resize-y"}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <button onClick={saveBio} disabled={saving} className={btnCls + " mt-4"}>
              <Save size={13} className="inline mr-1" /> {saving ? "Saving…" : "Save Bio"}
            </button>
          </div>
        )}

        {/* ── GALLERY TAB ── */}
        {tab === "gallery" && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest mb-2">Gallery</h2>
            <p className="text-gray-400 text-sm mb-6">Manage up to 12 photo slots shown in the gallery carousel.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img, i) => {
                const slot = i + 1;
                const isUploading = uploadingSlot === slot;
                return (
                  <div key={slot} className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    {img?.url ? (
                      <>
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white/20 hover:bg-white/40 rounded-lg p-2 transition-colors">
                            <Upload size={16} />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e, slot)} />
                          </label>
                          <button onClick={() => clearGallerySlot(slot)} className="bg-red-600/80 hover:bg-red-600 rounded-lg p-2 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-400 transition-colors">
                        {isUploading ? (
                          <span className="text-xs uppercase tracking-widest">Uploading…</span>
                        ) : (
                          <>
                            <Plus size={24} />
                            <span className="text-xs uppercase tracking-widest">Slot {slot}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e, slot)} />
                      </label>
                    )}
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {slot}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest mb-6">Staff Accounts</h2>

            <div className="space-y-2 mb-8">
              {users.map((u) => (
                <div key={u.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm uppercase tracking-wide">{u.username}</p>
                        {isUserLocked(u) && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-red-600/30 text-red-400 border border-red-600/40 px-2 py-0.5 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs capitalize">
                        {u.role}{u.barberId ? ` — Barber #${u.barberId}` : ""}
                        {isUserLocked(u) && u.lockedUntil && (
                          <span className="ml-2 text-red-400">
                            · Locked until {new Date(u.lockedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {!isUserLocked(u) && u.failedLoginAttempts > 0 && (
                          <span className="ml-2 text-yellow-500">
                            · {u.failedLoginAttempts} failed attempt{u.failedLoginAttempts !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    {isUserLocked(u) && (
                      <button
                        onClick={() => unlockUser(u.id)}
                        className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-yellow-500/40 text-yellow-400 hover:border-yellow-400 rounded-lg transition-colors mr-1"
                        title="Unlock account"
                      >
                        Unlock
                      </button>
                    )}
                    <button
                      onClick={() => { setResetPwUserId(resetPwUserId === u.id ? null : u.id); setResetPwValue(""); }}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-white/20 rounded-lg hover:border-white/60 transition-colors mr-1"
                      title="Reset password"
                    >
                      Reset PW
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {resetPwUserId === u.id && (
                    <div className="px-4 pb-4 flex items-center gap-2 border-t border-white/10 pt-3">
                      <input
                        type="password"
                        className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-red transition-colors"
                        placeholder="New password (min 6 chars)"
                        value={resetPwValue}
                        onChange={(e) => setResetPwValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && resetUserPassword(u.id)}
                      />
                      <button onClick={() => resetUserPassword(u.id)} className={btnCls}>
                        Save
                      </button>
                      <button onClick={() => { setResetPwUserId(null); setResetPwValue(""); }} className="text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Add Account</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Username</label>
                <input className={inputCls} value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} placeholder="username" />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" className={inputCls} value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="password" />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select className={inputCls} value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as "barber" | "admin" }))}>
                  <option value="barber">Barber</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Barber Profile (ID)</label>
                <select className={inputCls} value={newUser.barberId} onChange={(e) => setNewUser((p) => ({ ...p, barberId: e.target.value }))}>
                  <option value="">None (admin only)</option>
                  {barbers.map((b) => <option key={b.id} value={b.id}>{b.name} (#{b.id})</option>)}
                </select>
              </div>
            </div>
            <button onClick={saveNewUser} disabled={saving} className={btnCls + " mt-4"}>
              <Plus size={13} className="inline mr-1" /> {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
