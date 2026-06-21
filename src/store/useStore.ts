import { create } from 'zustand'
import type { User, Worker, SafetyAlert, Equipment, Material, ProgressTask, SalaryRecord, WorkOrder, Project, OperationLog } from '@/types'
import {
  mockCurrentUser,
  mockWorkers,
  mockSafetyAlerts,
  mockEquipment,
  mockMaterials,
  mockProgressTasks,
  mockSalaryRecords,
  mockWorkOrders,
  mockProjects,
  dashboardStats
} from '@/data/mockData'

interface AppState {
  currentUser: User
  workers: Worker[]
  safetyAlerts: SafetyAlert[]
  equipment: Equipment[]
  materials: Material[]
  progressTasks: ProgressTask[]
  salaryRecords: SalaryRecord[]
  workOrders: WorkOrder[]
  projects: Project[]
  selectedProject: string
  stats: DashboardStats
  operationLogs: OperationLog[]
  setSelectedProject: (id: string) => void
  addWorker: (worker: Omit<Worker, 'id' | 'entryTime' | 'status'> & { status?: Worker['status'] }) => Worker
  updateWorker: (id: string, worker: Partial<Worker>) => void
  deleteWorker: (id: string) => void
  updateWorkOrderStatus: (id: string, status: WorkOrder['status'], rectification?: string, reviewComment?: string, reviewer?: string) => void
  updateSafetyAlertStatus: (id: string, status: SafetyAlert['status'], handler?: string) => void
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'reportTime' | 'status'>) => void
  updateMaterialAcceptance: (id: string, result: 'passed' | 'rejected', operator: string, remark?: string) => void
  approveSalary: (ids: string[]) => void
  paySalary: (ids: string[]) => void
  retryPaySalary: (id: string) => void
  emergencyStopEquipment: (id: string, reason: string) => void
  unlockEquipment: (id: string, inspectionResult: string, resetNote: string, operator: string, targetStatus?: 'running' | 'warning') => void
  refreshStats: () => void
}

const nowStr = () => new Date().toISOString().replace('T', ' ').substring(0, 19)

type DashboardStats = {
  totalWorkers: number
  onSiteWorkers: number
  todayAttendance: number
  attendanceRate: number
  totalSafetyAlerts: number
  todaySafetyAlerts: number
  todayAlerts: number
  pendingSafetyAlerts: number
  safetyScore: number
  totalWorkOrders: number
  pendingWorkOrders: number
  closedWorkOrders: number
  closureRate: number
  totalMaterials: number
  pendingMaterials: number
  materialPassRate: number
  todayMaterialIn: number
  totalSalaryRecords: number
  paidSalaryRecords: number
  pendingSalaryRecords: number
  salaryPaymentRate: number
  totalSalaryAmount: number
  paidSalaryAmount: number
  pendingSalaryAmount: number
  equipmentTotal: number
  equipmentRunning: number
  equipmentWarning: number
  equipmentDanger: number
  equipmentLocked: number
  equipmentCount: number
  plannedProgress: number
  actualProgress: number
  progressDeviation: number
  totalProgress: number
}

const addLog = (state: AppState, log: Omit<OperationLog, 'id' | 'timestamp'>): Partial<AppState> => {
  const newLog: OperationLog = {
    ...log,
    id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
    timestamp: nowStr()
  }
  return { operationLogs: [newLog, ...state.operationLogs].slice(0, 200) }
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  workers: mockWorkers,
  safetyAlerts: mockSafetyAlerts,
  equipment: mockEquipment,
  materials: mockMaterials,
  progressTasks: mockProgressTasks,
  salaryRecords: mockSalaryRecords,
  workOrders: mockWorkOrders,
  projects: mockProjects,
  selectedProject: 'P001',
  stats: dashboardStats as DashboardStats,
  operationLogs: [],

  setSelectedProject: (id) => set({ selectedProject: id }),

  addWorker: (worker) => {
    const newId = `W${Date.now().toString().slice(-6)}`
    const trained = worker.trainingPassed && worker.trainingHours >= 24
    const certified = worker.certificate?.valid
    let status: Worker['status'] = 'on-site'
    if (!trained || !certified) {
      status = 'pending'
    }
    const newWorker: Worker = {
      ...worker,
      id: newId,
      entryTime: nowStr(),
      status: worker.status || status
    }
    set((state) => ({
      workers: [newWorker, ...state.workers],
      ...addLog(state, {
        type: 'worker-add',
        module: 'personnel',
        modulePath: '/personnel',
        title: '新增工人',
        description: `${newWorker.name}（${newWorker.workType}）已入场，状态：${newWorker.status === 'on-site' ? '在场' : '待审核'}`,
        operator: state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: newWorker.id,
        relatedName: newWorker.name,
        detailId: newWorker.id,
        defaultFilter: newWorker.status
      })
    }))
    get().refreshStats()
    return newWorker
  },

  updateWorker: (id, patch) => {
    set((state) => ({
      workers: state.workers.map((w) => {
        if (w.id !== id) return w
        const merged = { ...w, ...patch }
        let newStatus = merged.status
        if (patch.trainingPassed !== undefined || patch.trainingHours !== undefined || patch.certificate !== undefined) {
          const trained = merged.trainingPassed && merged.trainingHours >= 24
          const certified = merged.certificate?.valid
          if (!trained || !certified) {
            newStatus = 'pending'
          } else if (merged.status === 'pending') {
            newStatus = 'on-site'
          }
        }
        return { ...merged, status: newStatus }
      }),
      ...addLog(state, {
        type: 'worker-edit',
        module: 'personnel',
        modulePath: '/personnel',
        title: '编辑工人信息',
        description: `工人 ${state.workers.find(w => w.id === id)?.name} 信息已更新`,
        operator: state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: id,
        relatedName: state.workers.find(w => w.id === id)?.name || id,
        detailId: id,
        defaultFilter: 'all'
      })
    }))
    get().refreshStats()
  },

  deleteWorker: (id) => {
    set((state) => ({ workers: state.workers.filter((w) => w.id !== id) }))
    get().refreshStats()
  },

  updateWorkOrderStatus: (id, status, rectification, reviewComment, reviewer) => {
    set((state) => ({
      workOrders: state.workOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              rectification: rectification || order.rectification,
              rectificationTime: rectification ? nowStr() : order.rectificationTime,
              reviewer: reviewer || order.reviewer,
              reviewTime: (status === 'closed' || status === 'reviewing') ? nowStr() : order.reviewTime,
              reviewComment: reviewComment || order.reviewComment
            }
          : order
      ),
      ...(status === 'closed' ? addLog(state, {
        type: 'workorder-close',
        module: 'workorder',
        modulePath: '/workorder',
        title: '工单闭环',
        description: `工单「${state.workOrders.find(o => o.id === id)?.title}」已闭环归档`,
        operator: state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: id,
        relatedName: state.workOrders.find(o => o.id === id)?.title || id,
        detailId: id,
        defaultFilter: 'closed'
      }) : {})
    }))
    get().refreshStats()
  },

  updateSafetyAlertStatus: (id, status, handler) => {
    set((state) => ({
      safetyAlerts: state.safetyAlerts.map((alert) =>
        alert.id === id ? { ...alert, status, handler: handler || alert.handler } : alert
      ),
      ...(status === 'processing' || status === 'resolved' ? addLog(state, {
        type: 'alert-handle',
        module: 'safety',
        modulePath: '/safety',
        title: '处理安全预警',
        description: `${state.safetyAlerts.find(a => a.id === id)?.typeName}（${state.safetyAlerts.find(a => a.id === id)?.location}）已${status === 'processing' ? '开始处理' : '处理完成'}`,
        operator: handler || state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: id,
        relatedName: state.safetyAlerts.find(a => a.id === id)?.typeName || id,
        detailId: id,
        defaultFilter: 'all'
      }) : {})
    }))
    get().refreshStats()
  },

  addWorkOrder: (order) => {
    set((state) => ({
      workOrders: [
        {
          ...order,
          id: `WO${String(state.workOrders.length + 1).padStart(5, '0')}`,
          reportTime: nowStr(),
          status: 'pending'
        },
        ...state.workOrders
      ],
      ...addLog(state, {
        type: 'workorder-create',
        module: 'workorder',
        modulePath: '/workorder',
        title: '新建工单',
        description: `工单「${order.title}」已创建，负责人：${order.handler}`,
        operator: order.reporter,
        operatorRole: state.currentUser.roleName,
        relatedId: `WO${String(state.workOrders.length + 1).padStart(5, '0')}`,
        relatedName: order.title,
        detailId: `WO${String(state.workOrders.length + 1).padStart(5, '0')}`,
        defaultFilter: 'pending'
      })
    }))
    get().refreshStats()
  },

  updateMaterialAcceptance: (id, result, operator, remark) => {
    set((state) => {
      const mat = state.materials.find(m => m.id === id)
      return {
        materials: state.materials.map((m) =>
          m.id === id
            ? {
                ...m,
                acceptanceResult: result,
                acceptanceOperator: operator,
                acceptanceTime: nowStr(),
                acceptanceRemark: remark
              }
            : m
        ),
        ...addLog(state, {
          type: result === 'passed' ? 'material-accept' : 'material-reject',
          module: 'material',
          modulePath: '/material',
          title: result === 'passed' ? '材料验收通过' : '材料验收拒绝',
          description: `${mat?.name}（${mat?.spec}）${result === 'passed' ? '验收通过' : '验收拒绝'}，验收员：${operator}${remark ? '，备注：' + remark : ''}`,
          operator,
          operatorRole: state.currentUser.roleName,
          relatedId: id,
          relatedName: mat?.name || id,
          detailId: id,
          defaultFilter: result
        })
      }
    })
    get().refreshStats()
  },

  approveSalary: (ids) => {
    const idSet = new Set(ids)
    set((state) => ({
      salaryRecords: state.salaryRecords.map((r) =>
        idSet.has(r.id) && r.status === 'pending' ? { ...r, status: 'approved' } : r
      ),
      ...addLog(state, {
        type: 'salary-approve',
        module: 'salary',
        modulePath: '/salary',
        title: '工资审核通过',
        description: `${ids.length} 条工资记录审核通过`,
        operator: state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: ids[0],
        relatedName: `${ids.length}条记录`,
        detailId: ids[0],
        defaultFilter: 'approved'
      })
    }))
    get().refreshStats()
  },

  paySalary: (ids) => {
    const idSet = new Set(ids)
    const paidTime = nowStr()
    set((state) => ({
      salaryRecords: state.salaryRecords.map((r) =>
        idSet.has(r.id) && (r.status === 'approved' || r.status === 'failed')
          ? {
              ...r,
              status: 'paid',
              paidTime,
              bankFlowNo: `BANK${Date.now()}${Math.floor(Math.random() * 10000)}`
            }
          : r
      ),
      ...addLog(state, {
        type: 'salary-pay',
        module: 'salary',
        modulePath: '/salary',
        title: '工资发放成功',
        description: `${ids.length} 条工资已通过专户银行发放`,
        operator: state.currentUser.name,
        operatorRole: state.currentUser.roleName,
        relatedId: ids[0],
        relatedName: `${ids.length}条记录`,
        detailId: ids[0],
        defaultFilter: 'paid'
      })
    }))
    get().refreshStats()
  },

  retryPaySalary: (id) => {
    set((state) => {
      const rec = state.salaryRecords.find(r => r.id === id)
      return {
        salaryRecords: state.salaryRecords.map((r) =>
          r.id === id && r.status === 'failed'
            ? {
                ...r,
                status: 'paid',
                paidTime: nowStr(),
                bankFlowNo: `BANK${Date.now()}${Math.floor(Math.random() * 10000)}`
              }
            : r
        ),
        ...addLog(state, {
          type: 'salary-retry',
          module: 'salary',
          modulePath: '/salary',
          title: '工资重发成功',
          description: `${rec?.workerName}（¥${rec?.totalSalary.toLocaleString()}）重新发放成功`,
          operator: state.currentUser.name,
          operatorRole: state.currentUser.roleName,
          relatedId: id,
          relatedName: rec?.workerName || id,
          detailId: id,
          defaultFilter: 'paid'
        })
      }
    })
    get().refreshStats()
  },

  emergencyStopEquipment: (id, reason) => {
    set((state) => {
      const eq = state.equipment.find(e => e.id === id)
      return {
        equipment: state.equipment.map((e) =>
          e.id === id
            ? {
                ...e,
                status: 'offline',
                isLocked: true,
                lockReason: reason,
                lockTime: nowStr(),
                lastUpdate: nowStr()
              }
            : e
        ),
        ...addLog(state, {
          type: 'equipment-lock',
          module: 'equipment',
          modulePath: '/equipment',
          title: '设备紧急停机',
          description: `${eq?.name}（${eq?.typeName}）已执行断电/锁机保护，原因：${reason}`,
          operator: state.currentUser.name,
          operatorRole: state.currentUser.roleName,
          relatedId: id,
          relatedName: eq?.name || id,
          detailId: id,
          defaultFilter: 'locked'
        })
      }
    })
    get().refreshStats()
  },

  unlockEquipment: (id, inspectionResult, resetNote, operator, targetStatus = 'running') => {
    set((state) => {
      const eq = state.equipment.find(e => e.id === id)
      return {
        equipment: state.equipment.map((e) =>
          e.id === id
            ? {
                ...e,
                status: targetStatus,
                isLocked: false,
                lockReason: undefined,
                lockTime: undefined,
                unlockInspectionResult: inspectionResult,
                unlockResetNote: resetNote,
                unlockOperator: operator,
                unlockTime: nowStr(),
                lastUpdate: nowStr(),
                limitStatus: targetStatus === 'warning' ? '预警监控' : '正常'
              }
            : e
        ),
        ...addLog(state, {
          type: 'equipment-unlock',
          module: 'equipment',
          modulePath: '/equipment',
          title: '设备解锁复位',
          description: `${eq?.name}（${eq?.typeName}）已解锁复位为${targetStatus === 'running' ? '正常运行' : '预警'}状态，排查结果：${inspectionResult}`,
          operator,
          operatorRole: state.currentUser.roleName,
          relatedId: id,
          relatedName: eq?.name || id,
          detailId: id,
          defaultFilter: 'all'
        })
      }
    })
    get().refreshStats()
  },

  refreshStats: () => {
    const { workers, safetyAlerts, workOrders, materials, salaryRecords, equipment } = get()
    const onSite = workers.filter((w) => w.status === 'on-site').length
    const today = new Date().toDateString()
    const pendingWO = workOrders.filter((w) => w.status === 'pending' || w.status === 'processing').length
    const closedWO = workOrders.filter((w) => w.status === 'closed').length
    const totalWO = workOrders.length
    const pendingAlerts = safetyAlerts.filter((a) => a.status === 'pending').length
    const todayAlerts = safetyAlerts.filter((a) => new Date(a.captureTime).toDateString() === today).length
    const matPending = materials.filter((m) => m.acceptanceResult === 'pending').length
    const matPassed = materials.filter((m) => m.acceptanceResult === 'passed').length
    const matTotal = materials.length
    const passRate = matTotal > 0 ? (matPassed / matTotal) * 100 : 100
    const todayMatIn = materials.filter((m) => new Date(m.entryTime).toDateString() === today).length
    const salPaid = salaryRecords.filter((s) => s.status === 'paid').length
    const salPending = salaryRecords.filter((s) => s.status === 'pending').length
    const salApproved = salaryRecords.filter((s) => s.status === 'approved').length
    const salTotal = salaryRecords.length
    const salPaidRate = salTotal > 0 ? (salPaid / salTotal) * 100 : 100
    const totalSalary = salaryRecords.reduce((sum, r) => sum + r.totalSalary, 0)
    const paidSalary = salaryRecords.filter((s) => s.status === 'paid').reduce((sum, r) => sum + r.totalSalary, 0)
    const pendingSalary = salaryRecords.filter((s) => s.status !== 'paid').reduce((sum, r) => sum + r.totalSalary, 0)
    const equipRunning = equipment.filter((e) => e.status === 'running' && !e.isLocked).length
    const equipWarning = equipment.filter((e) => e.status === 'warning').length
    const equipDanger = equipment.filter((e) => e.status === 'danger' && !e.isLocked).length
    const equipLocked = equipment.filter((e) => e.isLocked).length
    const equipTotal = equipment.length
    const plannedProgress = 72
    const actualProgress = 68
    const progressDeviation = actualProgress - plannedProgress
    const closureRate = totalWO > 0 ? (closedWO / totalWO) * 100 : 100

    set({
      stats: {
        totalWorkers: workers.length,
        onSiteWorkers: onSite,
        todayAttendance: onSite,
        attendanceRate: workers.length > 0 ? (onSite / workers.length) * 100 : 100,
        totalSafetyAlerts: safetyAlerts.length,
        todaySafetyAlerts: todayAlerts,
        todayAlerts,
        pendingSafetyAlerts: pendingAlerts,
        safetyScore: 92,
        totalWorkOrders: totalWO,
        pendingWorkOrders: pendingWO,
        closedWorkOrders: closedWO,
        closureRate,
        totalMaterials: matTotal,
        pendingMaterials: matPending,
        materialPassRate: passRate,
        todayMaterialIn: todayMatIn,
        totalSalaryRecords: salTotal,
        paidSalaryRecords: salPaid,
        pendingSalaryRecords: salPending,
        salaryPaymentRate: salPaidRate,
        totalSalaryAmount: totalSalary,
        paidSalaryAmount: paidSalary,
        pendingSalaryAmount: pendingSalary,
        equipmentTotal: equipTotal,
        equipmentRunning: equipRunning,
        equipmentWarning: equipWarning,
        equipmentDanger: equipDanger,
        equipmentLocked: equipLocked,
        equipmentCount: equipTotal,
        plannedProgress,
        actualProgress,
        progressDeviation,
        totalProgress: actualProgress
      }
    })
  }
}))
