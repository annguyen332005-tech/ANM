export default function StatCard({ title, value, subtitle, icon, color = 'cyan', alert = false }) {
  const colorStyles = {
    cyan: 'border-cyan-500/20 bg-cyan-950/10 text-cyan-400 group-hover:border-cyan-500/40',
    blue: 'border-blue-500/20 bg-blue-950/10 text-blue-400 group-hover:border-blue-500/40',
    amber: 'border-amber-500/20 bg-amber-950/10 text-amber-400 group-hover:border-amber-500/40',
    red: 'border-red-500/20 bg-red-950/10 text-red-400 group-hover:border-red-500/40',
    emerald: 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400 group-hover:border-emerald-500/40',
  };

  const badgeColor = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-slate-900/60 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-0.5 ${badgeColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-mono">
            {value ?? 0}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${badgeColor}`}>
          {icon}
        </div>
      </div>
      {alert && (
        <div className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </div>
      )}
    </div>
  );
}
