import { create } from 'zustand'
import type { User, Worker, SafetyAlert, Equipment, Material, ProgressTask, SalaryRecord, WorkOrder, Project } from '@/types'
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
  refreshStats: () => void
}

const genId = (prefix: string, len: number) =>
  `${prefix}${Date.now().toString().slice(-len / 2)}${Math.random().toString(36).slice(2, 2 + len / 2)}`.toUpperCase().padEnd(len, '0')

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
  equipmentTotal: number
  equipmentRunning: number
  equipmentWarning: number
  equipmentDanger: number
  equipmentCount: number
  plannedProgress: number
  actualProgress: number
  progressDeviation: number
  totalProgress: number
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

  setSelectedProject: (id) => set({ selectedProject: id }),

  addWorker: (worker) => {
    const newId = `W${Date.now().toString().slice(-6)}`
    const trained = worker.trainingPassed && worker.trainingHours >= 24
    const certified = worker.certificate?.valid
    let status: Worker['status'] = 'on-site'
    if (!trained || !certified) {
      status = 'pending'
    }
    if (!certified && worker.certificate && !worker.certificate.valid) {
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
      stats: {
        ...state.stats,
        totalWorkers: state.stats.totalWorkers + 1,
        onSiteWorkers: newWorker.status === 'on-site' ? state.stats.onSiteWorkers + 1 : state.stats.onSiteWorkers
      }
    }))
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
      )
    }))
    get().refreshStats()
  },

  updateSafetyAlertStatus: (id, status, handler) => {
    set((state) => ({
      safetyAlerts: state.safetyAlerts.map((alert) =>
        alert.id === id ? { ...alert, status, handler: handler || alert.handler } : alert
      )
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
      ]
    }))
    get().refreshStats()
  },

  updateMaterialAcceptance: (id, result, operator, remark) => {
    set((state) => ({
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
      )
    }))
    get().refreshStats()
  },

  approveSalary: (ids) => {
    const idSet = new Set(ids)
    set((state) => ({
      salaryRecords: state.salaryRecords.map((r) =>
        idSet.has(r.id) && r.status === 'pending' ? { ...r, status: 'approved' } : r
      )
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
      )
    }))
    get().refreshStats()
  },

  retryPaySalary: (id) => {
    set((state) => ({
      salaryRecords: state.salaryRecords.map((r) =>
        r.id === id && r.status === 'failed'
          ? {
              ...r,
              status: 'paid',
              paidTime: nowStr(),
              bankFlowNo: `BANK${Date.now()}${Math.floor(Math.random() * 10000)}`
            }
          : r
      )
    }))
    get().refreshStats()
  },

  emergencyStopEquipment: (id, reason) => {
    set((state) => ({
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
      )
    }))
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
    const salTotal = salaryRecords.length
    const salPaidRate = salTotal > 0 ? (salPaid / salTotal) * 100 : 100
    const totalSalary = salaryRecords.reduce((sum, r) => sum + r.totalSalary, 0)
    const equipRunning = equipment.filter((e) => e.status === 'running' && !e.isLocked).length
    const equipDanger = equipment.filter((e) => e.status === 'danger' || e.isLocked).length
    const equipTotal = equipment.length
    const plannedProgress = 72
    const actualProgress = 68
    const progressDeviation = actualProgress - plannedProgress

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
        closureRate: totalWO > 0 ? (closedWO / totalWO) * 100 : 100,
        totalMaterials: matTotal,
        pendingMaterials: matPending,
        materialPassRate: passRate,
        todayMaterialIn: todayMatIn,
        totalSalaryRecords: salTotal,
        paidSalaryRecords: salPaid,
        pendingSalaryRecords: salPending,
        salaryPaymentRate: salPaidRate,
        totalSalaryAmount: totalSalary,
        equipmentTotal: equipTotal,
        equipmentRunning: equipRunning,
        equipmentWarning: equipment.filter((e) => e.status === 'warning').length,
        equipmentDanger: equipDanger,
        equipmentCount: equipTotal,
        plannedProgress,
        actualProgress,
        progressDeviation,
        totalProgress: actualProgress
      }
    })
  }
}))
