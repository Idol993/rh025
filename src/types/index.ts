export interface Worker {
  id: string
  name: string
  idCard: string
  phone: string
  workType: string
  team: string
  subcontractor: string
  emergencyContact: string
  status: 'on-site' | 'off-site' | 'blacklist' | 'pending'
  entryTime: string
  trainingHours: number
  trainingPassed: boolean
  certificate: {
    type: string
    number: string
    expiryDate: string
    valid: boolean
  }
  avatar?: string
  lastCheckIn?: string
}

export interface SafetyAlert {
  id: string
  type: 'helmet' | 'vest' | 'fire' | 'danger-zone' | 'safety-belt'
  typeName: string
  level: 'low' | 'medium' | 'high' | 'critical'
  location: string
  cameraId: string
  captureTime: string
  imageUrl: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  handler?: string
  description: string
}

export interface Equipment {
  id: string
  name: string
  type: 'tower-crane' | 'elevator' | 'platform'
  typeName: string
  model: string
  status: 'running' | 'warning' | 'danger' | 'offline'
  isLocked?: boolean
  lockReason?: string
  lockTime?: string
  unlockInspectionResult?: string
  unlockResetNote?: string
  unlockOperator?: string
  unlockTime?: string
  load: number
  maxLoad: number
  angle: number
  height: number
  windSpeed: number
  moment: number
  maxMoment: number
  limitStatus: string
  location: string
  operator: string
  lastUpdate: string
}

export interface Material {
  id: string
  name: string
  spec: string
  supplier: string
  plateNumber: string
  deliveryOrderNo: string
  deliveryWeight: number
  actualWeight: number
  weightDiff: number
  weightDiffPercent: number
  acceptanceResult: 'passed' | 'rejected' | 'pending'
  acceptanceOperator?: string
  acceptanceTime?: string
  acceptanceRemark?: string
  images: string[]
  usePosition: string
  entryTime: string
  operator: string
}

export interface ProgressTask {
  id: string
  name: string
  wbsCode: string
  plannedStart: string
  plannedEnd: string
  plannedVolume: number
  actualStart?: string
  actualEnd?: string
  actualVolume: number
  progress: number
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  isCritical: boolean
  floor: number
  building: string
}

export interface SalaryRecord {
  id: string
  workerId: string
  workerName: string
  workType: string
  team: string
  attendanceDays: number
  workHours: number
  overtimeHours: number
  basicSalary: number
  overtimeSalary: number
  subsidy: number
  totalSalary: number
  month: string
  status: 'pending' | 'approved' | 'paid' | 'failed'
  bankFlowNo?: string
  paidTime?: string
}

export interface WorkOrder {
  id: string
  title: string
  type: 'safety' | 'quality' | 'progress' | 'equipment'
  typeName: string
  level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  images: string[]
  location: string
  reporter: string
  reportTime: string
  handler: string
  deadline: string
  status: 'pending' | 'processing' | 'reviewing' | 'closed'
  rectification?: string
  rectificationImages?: string[]
  rectificationTime?: string
  reviewer?: string
  reviewTime?: string
  reviewComment?: string
}

export interface Project {
  id: string
  name: string
  address: string
  manager: string
  totalArea: number
  totalInvestment: number
  startDate: string
  plannedEndDate: string
  status: 'planning' | 'in-progress' | 'completed'
  progress: number
  safetyScore: number
  workersCount: number
  hiddenDangerCount: number
}

export type Role = 'worker' | 'safety-officer' | 'project-manager' | 'group-admin'

export interface User {
  id: string
  name: string
  role: Role
  roleName: string
  avatar?: string
  phone: string
  department: string
  permissions: string[]
}

export interface OperationLog {
  id: string
  type: 'worker-add' | 'worker-edit' | 'material-accept' | 'material-reject' | 'salary-approve' | 'salary-pay' | 'salary-retry' | 'equipment-lock' | 'equipment-unlock' | 'workorder-create' | 'workorder-close' | 'alert-handle'
  module: 'personnel' | 'material' | 'salary' | 'equipment' | 'workorder' | 'safety'
  modulePath: string
  title: string
  description: string
  operator: string
  operatorRole: string
  relatedId: string
  relatedName: string
  timestamp: string
}
