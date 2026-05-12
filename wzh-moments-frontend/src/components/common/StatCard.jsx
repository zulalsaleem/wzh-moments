const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100',   text: 'text-blue-600',   val: 'text-blue-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-600', val: 'text-purple-700' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100',  text: 'text-green-600',  val: 'text-green-700' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100',    text: 'text-red-600',    val: 'text-red-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100', text: 'text-yellow-600', val: 'text-yellow-700' },
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100',   text: 'text-teal-600',   val: 'text-teal-700' },
};

export default function StatCard({ label, value, icon: Icon, color = 'blue', subtitle, trend }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white/60`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-2xl font-bold ${c.val} leading-none`}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs mt-1.5 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${c.icon} p-2.5 rounded-xl shrink-0`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
        )}
      </div>
    </div>
  );
}
