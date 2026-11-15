export default function RiskMatrixCard({ matrix = {}, total = 0 }) {
  // Cells in 3x3 matrix:
  // Row High: High-Low (Med), High-Med (High), High-High (Critical)
  // Row Medium: Med-Low (Low), Med-Med (Med), Med-High (High)
  // Row Low: Low-Low (Low), Low-Med (Low), Low-High (Med)

  const cells = [
    // Row 1: Likelihood = High
    { row: 'High', col: 'Low', count: matrix.high_low || 0, level: 'medium', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/60' },
    { row: 'High', col: 'Medium', count: matrix.high_medium || 0, level: 'high', bg: 'bg-orange-950/50 text-orange-300 border-orange-800/80' },
    { row: 'High', col: 'High', count: matrix.high_high || 0, level: 'critical', bg: 'bg-red-950/70 text-red-300 border-red-700 font-bold animate-pulse' },

    // Row 2: Likelihood = Medium
    { row: 'Medium', col: 'Low', count: matrix.medium_low || 0, level: 'low', bg: 'bg-emerald-950/30 text-emerald-300 border-emerald-900/60' },
    { row: 'Medium', col: 'Medium', count: matrix.medium_medium || 0, level: 'medium', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/60' },
    { row: 'Medium', col: 'High', count: matrix.medium_high || 0, level: 'high', bg: 'bg-orange-950/50 text-orange-300 border-orange-800/80' },

    // Row 3: Likelihood = Low
    { row: 'Low', col: 'Low', count: matrix.low_low || 0, level: 'low', bg: 'bg-emerald-950/30 text-emerald-300 border-emerald-900/60' },
    { row: 'Low', col: 'Medium', count: matrix.low_medium || 0, level: 'low', bg: 'bg-emerald-950/30 text-emerald-300 border-emerald-900/60' },
    { row: 'Low', col: 'High', count: matrix.low_high || 0, level: 'medium', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/60' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Ma trận rủi ro 3×3 (NIST Risk Matrix)</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              ID.RA-1
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Khả năng xảy ra (Likelihood) × Mức độ ảnh hưởng (Impact) • Tổng: {total} rủi ro
          </p>
        </div>
      </div>

      <div className="flex">
        {/* Y-Axis Label (Likelihood) */}
        <div className="w-8 flex flex-col items-center justify-between py-6 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          <span>High</span>
          <span className="rotate-[-90deg] my-auto">Khả năng</span>
          <span>Low</span>
        </div>

        {/* Matrix Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {cells.map((cell, idx) => (
              <div
                key={idx}
                className={`h-20 rounded-lg border p-2 flex flex-col justify-between transition hover:scale-[1.02] ${cell.bg}`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono uppercase opacity-75">
                  <span>{cell.level}</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-mono font-black">{cell.count}</span>
                  <span className="text-[10px] block opacity-60">rủi ro</span>
                </div>
              </div>
            ))}
          </div>

          {/* X-Axis Label (Impact) */}
          <div className="grid grid-cols-3 gap-2 text-center mt-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Low Impact</span>
            <span>Med Impact</span>
            <span>High Impact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
