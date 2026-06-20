import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: ReactNode
  trend?: number
  trendLabel?: string
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange'
  suffix?: ReactNode
  subValue?: string
}

const colorMap = {
  cyan: 'from-cyan-400 to-cyan-600',
  green: 'from-green-400 to-green-600',
  yellow: 'from-yellow-400 to-yellow-600',
  red: 'from-red-400 to-red-600',
  blue: 'from-blue-400 to-blue-600',
  purple: 'from-purple-400 to-purple-600',
  orange: 'from-orange-400 to-orange-600'
}

const textColorMap = {
  cyan: 'text-cyan-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400'
}

export default function StatCard({ title, value, unit, icon, trend, trendLabel = '较昨日', color = 'cyan', suffix, subValue }: StatCardProps) {
  return (
    <div className="stat-card relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colorMap[color]} group-hover:h-full transition-all`} />
      
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-400 text-sm mb-1">{title}</div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold glow-text ${textColorMap[color]}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-gray-400 text-sm">{unit}</span>}
            {suffix}
          </div>
          
          {subValue && (
            <div className="text-gray-400 text-xs mt-1">{subValue}</div>
          )}
          
          {trend !== undefined && (
            <div className={`mt-2 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} bg-opacity-20 flex items-center justify-center text-2xl text-white shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
    </div>
  )
}
