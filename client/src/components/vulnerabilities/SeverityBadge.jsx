export default function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-950 text-red-400 border-red-800 shadow-sm shadow-red-950',
    high: 'bg-orange-950 text-orange-400 border-orange-800',
    medium: 'bg-amber-950 text-amber-400 border-amber-800',
    low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    info: 'bg-cyan-950 text-cyan-400 border-cyan-800',
  };

  const currentStyle = styles[severity?.toLowerCase()] || styles.medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {severity}
    </span>
  );
}
