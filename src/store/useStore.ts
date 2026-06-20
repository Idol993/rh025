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
  stats: typeof dashboardStats
  setSelectedProject: (id: string) => void
  updateWorkOrderStatus: (id: string, status: WorkOrder['status'], rectification?: string) => void
  updateSafetyAlertStatus: (id: string, status: SafetyAlert['status'], handler?: string) => void
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'reportTime' | 'status'>) => void
}

export const useAppStore = create<AppState>((set) => ({
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
  stats: dashboardStats,
  
  setSelectedProject: (id) => set({ selectedProject: id }),
  
  updateWorkOrderStatus: (id, status, rectification) => set((state) => ({
    workOrders: state.workOrders.map((order) =>
      order.id === id
        ? {
            ...order,
            status,
            rectification: rectification || order.rectification,
            rectificationTime: rectification ? new Date().toISOString().replace('T', ' ').substring(0, 19) : order.rectificationTime
          }
        : order
    )
  })),
  
  updateSafetyAlertStatus: (id, status, handler) => set((state) => ({
    safetyAlerts: state.safetyAlerts.map((alert) =>
      alert.id === id ? { ...alert, status, handler: handler || alert.handler } : alert
    )
  })),
  
  addWorkOrder: (order) => set((state) => ({
    workOrders: [
      {
        ...order,
        id: `WO${String(state.workOrders.length + 1).padStart(5, '0')}`,
        reportTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'pending'
      },
      ...state.workOrders
    ],
    stats: {
      ...state.stats,
      pendingWorkOrders: state.stats.pendingWorkOrders + 1
    }
  }))
}))
