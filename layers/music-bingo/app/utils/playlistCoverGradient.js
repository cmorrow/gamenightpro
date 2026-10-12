/** Stable pseudo-random gradient class for playlist cards (no config or assets). */
export function gradientForPlaylistId(id) {
  const gradients = [
    "bg-gradient-to-br from-fuchsia-600 via-purple-900 to-slate-950",
    "bg-gradient-to-br from-orange-600 via-red-900 to-stone-950",
    "bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-950",
    "bg-gradient-to-br from-rose-600 via-pink-900 to-zinc-950",
    "bg-gradient-to-br from-lime-500 via-emerald-800 to-neutral-950",
    "bg-gradient-to-br from-sky-600 via-blue-950 to-slate-950",
    "bg-gradient-to-br from-violet-700 via-indigo-950 to-black",
    "bg-gradient-to-br from-pink-600 via-purple-800 to-slate-950",
    "bg-[radial-gradient(circle_at_40%_35%,#fef9c3_0%,#94a3b8_25%,#1e293b_55%,#020617_100%)]",
    "bg-gradient-to-r from-amber-700 via-orange-900 to-stone-950",
  ];
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return gradients[h % gradients.length];
}
