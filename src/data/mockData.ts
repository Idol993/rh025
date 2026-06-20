import type { Worker, SafetyAlert, Equipment, Material, ProgressTask, SalaryRecord, WorkOrder, Project, User } from '@/types'

const workTypes = ['钢筋工', '模板工', '混凝土工', '架子工', '电焊工', '电工', '塔吊司机', '施工升降机司机', '砌筑工', '抹灰工', '防水工', '管道工']
const teams = ['土建一队', '土建二队', '水电一队', '装修一队', '钢结构队', '机电安装队']
const subcontractors = ['建工一建', '建工二建', '华建集团', '中铁建设', '中建三局', '上海宝冶']

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0]
}

function randomDateTime(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

export const mockWorkers: Worker[] = Array.from({ length: 120 }, (_, i) => {
  const workType = randomItem(workTypes)
  const isSpecial = ['塔吊司机', '施工升降机司机', '电工', '电焊工', '架子工'].includes(workType)
  const trainingPassed = Math.random() > 0.08
  const validCert = Math.random() > 0.05
  
  return {
    id: `W${String(i + 1).padStart(4, '0')}`,
    name: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'][i % 10] + (i > 9 ? i : ''),
    idCard: '310' + String(Math.floor(Math.random() * 100000000000000000)).padStart(15, '0'),
    phone: '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
    workType,
    team: randomItem(teams),
    subcontractor: randomItem(subcontractors),
    emergencyContact: '139' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
    status: i < 95 ? 'on-site' : i < 105 ? 'off-site' : i < 110 ? 'blacklist' : 'pending',
    entryTime: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
    trainingHours: trainingPassed ? 24 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 20),
    trainingPassed,
    certificate: {
      type: isSpecial ? workType + '操作证' : '上岗证',
      number: 'Cert-' + Math.floor(Math.random() * 100000).toString().padStart(6, '0'),
      expiryDate: randomDate(new Date('2025-06-01'), new Date('2027-12-31')),
      valid: validCert
    },
    lastCheckIn: randomDateTime(new Date('2025-06-01'), new Date())
  }
})

const alertTypes = [
  { type: 'helmet', name: '未戴安全帽', level: 'medium' as const },
  { type: 'vest', name: '未穿反光背心', level: 'low' as const },
  { type: 'fire', name: '烟火检测', level: 'critical' as const },
  { type: 'danger-zone', name: '人员闯入危险区域', level: 'high' as const },
  { type: 'safety-belt', name: '高空作业未系安全带', level: 'high' as const },
]

const locations = ['1号楼东侧', '2号楼南侧', '3号楼西侧', '4号楼北侧', '基坑区域', '钢筋加工区', '模板堆放区', '施工升降机1号', '塔吊1号作业区', '脚手架搭设区']

export const mockSafetyAlerts: SafetyAlert[] = Array.from({ length: 86 }, (_, i) => {
  const at = randomItem(alertTypes)
  const statuses = ['pending', 'processing', 'resolved', 'closed'] as const
  const status = i < 15 ? 'pending' : i < 35 ? 'processing' : randomItem(statuses)
  
  return {
    id: `SA${String(i + 1).padStart(5, '0')}`,
    type: at.type,
    typeName: at.name,
    level: at.level,
    location: randomItem(locations),
    cameraId: `CAM-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
    captureTime: randomDateTime(new Date('2025-06-01'), new Date()),
    imageUrl: `https://picsum.photos/400/300?random=${i}`,
    status,
    handler: status !== 'pending' ? randomItem(['安全员A', '安全员B', '安全员C', '安全员D']) : undefined,
    description: `${at.name} - 位置：${randomItem(locations)}`
  } as SafetyAlert
}).sort((a, b) => new Date(b.captureTime).getTime() - new Date(a.captureTime).getTime())

export const mockEquipment: Equipment[] = [
  {
    id: 'EQ-001',
    name: '1号塔吊',
    type: 'tower-crane',
    typeName: '塔式起重机',
    model: 'QTZ80',
    status: 'running',
    load: 4.2,
    maxLoad: 8,
    angle: 15.3,
    height: 68,
    windSpeed: 3.2,
    moment: 52,
    maxMoment: 80,
    limitStatus: '正常',
    location: '1号楼北侧',
    operator: '李师傅',
    lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
  },
  {
    id: 'EQ-002',
    name: '2号塔吊',
    type: 'tower-crane',
    typeName: '塔式起重机',
    model: 'QTZ63',
    status: 'warning',
    load: 5.8,
    maxLoad: 6,
    angle: 22.8,
    height: 55,
    windSpeed: 5.1,
    moment: 72,
    maxMoment: 63,
    limitStatus: '力矩预警',
    location: '2号楼南侧',
    operator: '王师傅',
    lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
  },
  {
    id: 'EQ-003',
    name: '1号施工升降机',
    type: 'elevator',
    typeName: '施工升降机',
    model: 'SC200/200',
    status: 'running',
    load: 1.2,
    maxLoad: 2,
    angle: 0.5,
    height: 45,
    windSpeed: 2.8,
    moment: 0,
    maxMoment: 0,
    limitStatus: '正常',
    location: '1号楼东侧',
    operator: '张师傅',
    lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
  },
  {
    id: 'EQ-004',
    name: '2号施工升降机',
    type: 'elevator',
    typeName: '施工升降机',
    model: 'SC200/200',
    status: 'danger',
    load: 1.9,
    maxLoad: 2,
    angle: 3.2,
    height: 38,
    windSpeed: 6.5,
    moment: 0,
    maxMoment: 0,
    limitStatus: '倾斜超标',
    location: '3号楼西侧',
    operator: '刘师傅',
    lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
  },
  {
    id: 'EQ-005',
    name: '1号卸料平台',
    type: 'platform',
    typeName: '卸料平台',
    model: 'XLP-8',
    status: 'running',
    load: 0.8,
    maxLoad: 1.5,
    angle: 1.2,
    height: 32,
    windSpeed: 2.5,
    moment: 0,
    maxMoment: 0,
    limitStatus: '正常',
    location: '2号楼东侧15层',
    operator: '赵师傅',
    lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
]

const materialNames = [
  { name: 'HRB400E螺纹钢', spec: 'φ16mm' },
  { name: 'HRB400E螺纹钢', spec: 'φ20mm' },
  { name: 'HRB400E螺纹钢', spec: 'φ25mm' },
  { name: '商品混凝土', spec: 'C30' },
  { name: '商品混凝土', spec: 'C35' },
  { name: '商品混凝土', spec: 'C40' },
  { name: '木模板', spec: '1830×915×15mm' },
  { name: '钢管', spec: 'φ48×3.5mm' },
  { name: '扣件', spec: '十字扣' },
  { name: '黄沙', spec: '中砂' },
  { name: '水泥', spec: 'P.O 42.5' },
  { name: '加气混凝土砌块', spec: '600×240×200mm' },
]

const suppliers = ['宝钢集团', '沙钢集团', '中建商砼', '海螺水泥', '金隅集团', '南钢集团', '马钢集团']

export const mockMaterials: Material[] = Array.from({ length: 68 }, (_, i) => {
  const mat = randomItem(materialNames)
  const deliveryWeight = 10 + Math.random() * 40
  const actualWeight = deliveryWeight * (0.97 + Math.random() * 0.05)
  const diff = actualWeight - deliveryWeight
  const diffPercent = (diff / deliveryWeight) * 100
  const accepted = Math.abs(diffPercent) < 3
  
  return {
    id: `MAT${String(i + 1).padStart(5, '0')}`,
    name: mat.name,
    spec: mat.spec,
    supplier: randomItem(suppliers),
    plateNumber: `沪${randomItem(['A', 'B', 'C', 'D'])}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    deliveryOrderNo: `DO${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    deliveryWeight: Number(deliveryWeight.toFixed(2)),
    actualWeight: Number(actualWeight.toFixed(2)),
    weightDiff: Number(diff.toFixed(2)),
    weightDiffPercent: Number(diffPercent.toFixed(2)),
    acceptanceResult: accepted ? 'passed' : Math.random() > 0.5 ? 'rejected' : 'pending',
    images: [`https://picsum.photos/200/150?random=${i}1`, `https://picsum.photos/200/150?random=${i}2`],
    usePosition: `${randomItem(['1号楼', '2号楼', '3号楼'])}${randomItem(['地下1层', '地上1层', '地上5层', '地上10层', '地上15层'])}`,
    entryTime: randomDateTime(new Date('2025-05-01'), new Date()),
    operator: randomItem(['材料员A', '材料员B', '材料员C'])
  } as Material
}).sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())

const taskNames = [
  '地下室底板混凝土浇筑',
  '地下室侧壁模板安装',
  '地下室顶板钢筋绑扎',
  '一层柱模板安装',
  '一层梁板钢筋绑扎',
  '一层混凝土浇筑',
  '二层模板支撑架搭设',
  '二层柱钢筋绑扎',
  '二层梁板模板安装',
  '二层混凝土浇筑',
  '三层至十层标准层施工',
  '外墙脚手架搭设',
  '砌体工程施工',
  '内墙抹灰',
  '外墙保温',
  '门窗安装',
  '水电管线预埋',
  '消防管道安装',
  '电梯安装',
  '屋面防水'
]

export const mockProgressTasks: ProgressTask[] = taskNames.map((name, i) => {
  const start = new Date('2024-10-01')
  start.setDate(start.getDate() + i * 15)
  const end = new Date(start)
  end.setDate(end.getDate() + 14)
  
  const actualStart = new Date(start)
  actualStart.setDate(actualStart.getDate() + Math.floor(Math.random() * 5) - 2)
  
  const progress = i < 8 ? 100 : i < 15 ? 30 + Math.random() * 50 : Math.random() * 20
  const isDelayed = i >= 8 && progress < 50 && Math.random() > 0.5
  
  return {
    id: `TASK${String(i + 1).padStart(3, '0')}`,
    name,
    wbsCode: `WBS.${String(i + 1).padStart(3, '0')}`,
    plannedStart: start.toISOString().split('T')[0],
    plannedEnd: end.toISOString().split('T')[0],
    plannedVolume: 100 + Math.random() * 400,
    actualStart: i > 0 ? actualStart.toISOString().split('T')[0] : undefined,
    actualEnd: progress >= 100 ? new Date().toISOString().split('T')[0] : undefined,
    actualVolume: progress * 3,
    progress: Number(progress.toFixed(1)),
    status: progress === 0 ? 'not-started' : progress >= 100 ? 'completed' : isDelayed ? 'delayed' : 'in-progress',
    isCritical: i < 5 || (i >= 10 && i < 13),
    floor: Math.floor(i / 2),
    building: i % 3 === 0 ? '1号楼' : i % 3 === 1 ? '2号楼' : '3号楼'
  }
})

export const mockSalaryRecords: SalaryRecord[] = Array.from({ length: 240 }, (_, i) => {
  const worker = mockWorkers[i % mockWorkers.length]
  const days = 22 + Math.floor(Math.random() * 8)
  const hours = days * 8
  const overtime = Math.floor(Math.random() * 40)
  const basic = 200 + Math.floor(Math.random() * 300)
  
  return {
    id: `SAL${String(i + 1).padStart(5, '0')}`,
    workerId: worker.id,
    workerName: worker.name,
    workType: worker.workType,
    team: worker.team,
    attendanceDays: days,
    workHours: hours,
    overtimeHours: overtime,
    basicSalary: basic * days,
    overtimeSalary: Math.floor(basic * 1.5 * overtime / 8),
    subsidy: Math.floor(Math.random() * 500),
    totalSalary: Math.floor(basic * days + basic * 1.5 * overtime / 8 + Math.random() * 500),
    month: i < 80 ? '2025-05' : i < 160 ? '2025-04' : '2025-03',
    status: i < 20 ? 'pending' : i < 50 ? 'approved' : i < 70 ? 'failed' : 'paid',
    bankFlowNo: i >= 70 ? 'BANK' + String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0') : undefined,
    paidTime: i >= 70 ? randomDateTime(new Date('2025-05-15'), new Date('2025-05-25')) : undefined
  }
})

const woTypes = [
  { type: 'safety', name: '安全隐患' },
  { type: 'quality', name: '质量问题' },
  { type: 'progress', name: '进度滞后' },
  { type: 'equipment', name: '设备故障' }
]

export const mockWorkOrders: WorkOrder[] = Array.from({ length: 56 }, (_, i) => {
  const wt = randomItem(woTypes)
  const levels = ['low', 'medium', 'high', 'critical'] as const
  const statuses = ['pending', 'processing', 'reviewing', 'closed'] as const
  const status = i < 10 ? 'pending' : i < 25 ? 'processing' : i < 40 ? 'reviewing' : 'closed'
  const level = randomItem(levels)
  
  return {
    id: `WO${String(i + 1).padStart(5, '0')}`,
    title: `${wt.name}整改通知 - ${randomItem(locations)}`,
    type: wt.type,
    typeName: wt.name,
    level,
    description: `发现${wt.name}，需要立即整改。详细情况请查看现场照片。`,
    images: [`https://picsum.photos/300/200?random=${i}a`, `https://picsum.photos/300/200?random=${i}b`],
    location: randomItem(locations),
    reporter: randomItem(['安全员A', '安全员B', '质检员C', '施工员D']),
    reportTime: randomDateTime(new Date('2025-06-01'), new Date()),
    handler: randomItem(['班组长A', '班组长B', '班组长C', '分包负责人D']),
    deadline: (() => {
      const d = new Date()
      d.setDate(d.getDate() + (level === 'critical' ? 1 : level === 'high' ? 3 : 7))
      return d.toISOString().split('T')[0]
    })(),
    status,
    rectification: status !== 'pending' ? '已完成整改，整改内容包括：1. 清理现场隐患 2. 加强安全教育 3. 落实防护措施' : undefined,
    rectificationImages: status !== 'pending' ? [`https://picsum.photos/300/200?random=${i}c`, `https://picsum.photos/300/200?random=${i}d`] : undefined,
    rectificationTime: status !== 'pending' ? randomDateTime(new Date('2025-06-01'), new Date()) : undefined,
    reviewer: status === 'reviewing' || status === 'closed' ? randomItem(['安全员A', '项目经理']) : undefined,
    reviewTime: status === 'closed' ? randomDateTime(new Date('2025-06-01'), new Date()) : undefined,
    reviewComment: status === 'closed' ? (Math.random() > 0.2 ? '整改合格，同意关闭' : '需进一步整改') : undefined
  } as WorkOrder
}).sort((a, b) => new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime())

export const mockProjects: Project[] = [
  {
    id: 'P001',
    name: '智慧新城一期项目',
    address: '浦东新区张江高科技园区',
    manager: '张经理',
    totalArea: 125000,
    totalInvestment: 1580000000,
    startDate: '2024-03-15',
    plannedEndDate: '2026-09-30',
    status: 'in-progress',
    progress: 45.6,
    safetyScore: 92,
    workersCount: 328,
    hiddenDangerCount: 12
  },
  {
    id: 'P002',
    name: '滨江商务区办公楼',
    address: '黄浦区外滩金融中心',
    manager: '李经理',
    totalArea: 85000,
    totalInvestment: 1250000000,
    startDate: '2024-06-01',
    plannedEndDate: '2026-12-31',
    status: 'in-progress',
    progress: 32.8,
    safetyScore: 88,
    workersCount: 245,
    hiddenDangerCount: 8
  },
  {
    id: 'P003',
    name: '虹桥枢纽配套住宅',
    address: '闵行区虹桥商务区',
    manager: '王经理',
    totalArea: 156000,
    totalInvestment: 980000000,
    startDate: '2024-01-10',
    plannedEndDate: '2026-06-30',
    status: 'in-progress',
    progress: 62.3,
    safetyScore: 95,
    workersCount: 412,
    hiddenDangerCount: 5
  },
  {
    id: 'P004',
    name: '临港产业园标准厂房',
    address: '浦东新区临港新城',
    manager: '赵经理',
    totalArea: 68000,
    totalInvestment: 560000000,
    startDate: '2024-09-01',
    plannedEndDate: '2025-12-31',
    status: 'in-progress',
    progress: 78.5,
    safetyScore: 90,
    workersCount: 186,
    hiddenDangerCount: 15
  }
]

export const mockCurrentUser: User = {
  id: 'U001',
  name: '系统管理员',
  role: 'group-admin',
  roleName: '集团工程部',
  phone: '13800138000',
  department: '工程管理中心',
  permissions: ['all']
}

export const roleOptions = [
  { value: 'worker', label: '工人' },
  { value: 'safety-officer', label: '安全员' },
  { value: 'project-manager', label: '项目经理' },
  { value: 'group-admin', label: '集团工程部' }
]

export const dashboardStats = {
  totalWorkers: 328,
  onSiteWorkers: 295,
  todayAlerts: 18,
  pendingWorkOrders: 15,
  totalProgress: 45.6,
  safetyScore: 92,
  todayMaterialIn: 12,
  equipmentCount: 8,
  equipmentRunning: 6
}
