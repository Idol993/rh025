interface StatusTagProps {
  status: string
  type?: 'default' | 'worker' | 'alert' | 'equipment' | 'material' | 'workorder' | 'salary' | 'task'
}

const statusConfig: Record<string, Record<string, { bg: string; text: string; label: string }>> = {
  default: {
    success: { bg: 'bg-green-500/20', text: 'text-green-400', label: '成功' },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '警告' },
    danger: { bg: 'bg-red-500/20', text: 'text-red-400', label: '危险' },
    info: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '信息' }
  },
  worker: {
    'on-site': { bg: 'bg-green-500/20', text: 'text-green-400', label: '在场' },
    'off-site': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '离场' },
    'blacklist': { bg: 'bg-red-500/20', text: 'text-red-400', label: '黑名单' },
    'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待审核' }
  },
  alert: {
    'pending': { bg: 'bg-red-500/20', text: 'text-red-400', label: '待处理' },
    'processing': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '处理中' },
    'resolved': { bg: 'bg-green-500/20', text: 'text-green-400', label: '已解决' },
    'closed': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '已关闭' }
  },
  equipment: {
    'running': { bg: 'bg-green-500/20', text: 'text-green-400', label: '运行中' },
    'warning': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '预警' },
    'danger': { bg: 'bg-red-500/20', text: 'text-red-400', label: '危险' },
    'offline': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '离线' }
  },
  material: {
    'passed': { bg: 'bg-green-500/20', text: 'text-green-400', label: '验收通过' },
    'rejected': { bg: 'bg-red-500/20', text: 'text-red-400', label: '验收拒绝' },
    'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待验收' }
  },
  workorder: {
    'pending': { bg: 'bg-red-500/20', text: 'text-red-400', label: '待派单' },
    'processing': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '整改中' },
    'reviewing': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '复查中' },
    'closed': { bg: 'bg-green-500/20', text: 'text-green-400', label: '已闭环' }
  },
  salary: {
    'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待审核' },
    'approved': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '已审核' },
    'paid': { bg: 'bg-green-500/20', text: 'text-green-400', label: '已发放' },
    'failed': { bg: 'bg-red-500/20', text: 'text-red-400', label: '发放失败' }
  },
  task: {
    'not-started': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '未开始' },
    'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '进行中' },
    'completed': { bg: 'bg-green-500/20', text: 'text-green-400', label: '已完成' },
    'delayed': { bg: 'bg-red-500/20', text: 'text-red-400', label: '已滞后' }
  }
}

const levelConfig: Record<string, { bg: string; text: string; label: string }> = {
  'low': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '低' },
  'medium': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '中' },
  'high': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '高' },
  'critical': { bg: 'bg-red-500/20', text: 'text-red-400', label: '严重' }
}

export default function StatusTag({ status, type = 'default' }: StatusTagProps) {
  const config = type === 'default' ? levelConfig[status] || statusConfig.default[status] : statusConfig[type]?.[status]
  
  if (!config) {
    return <span className="px-2 py-1 rounded text-xs">{status}</span>
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
