import { useState, useMemo } from 'react'
import { Card, Table, Tag, Button, Modal, Row, Col, Progress, List, Avatar, Tabs, Empty, Alert, Space, Statistic, Timeline, Tooltip, Select, DatePicker } from 'antd'
import { WarningOutlined, CheckCircleOutlined, SafetyOutlined, BarChartOutlined, TeamOutlined, DollarOutlined, ApartmentOutlined, UserOutlined, KeyOutlined, EyeOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Option } = Select
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import type { Project, User, Role } from '@/types'

const { TabPane } = Tabs

export default function GroupMonitor() {
  const { projects, workers, safetyAlerts, workOrders, salaryRecords, currentUser } = useAppStore()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [detailModal, setDetailModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const groupStats = useMemo(() => {
    const totalWorkers = projects.reduce((sum, p) => sum + p.workersCount, 0)
    const totalArea = projects.reduce((sum, p) => sum + p.totalArea, 0)
    const totalInvestment = projects.reduce((sum, p) => sum + p.totalInvestment, 0)
    const avgSafetyScore = Math.round(projects.reduce((sum, p) => sum + p.safetyScore, 0) / projects.length * 10) / 10
    const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length * 10) / 10
    const totalDangers = projects.reduce((sum, p) => sum + p.hiddenDangerCount, 0)
    const pendingWorkOrders = workOrders.filter(o => o.status !== 'closed').length
    const salaryThisMonth = salaryRecords.filter(s => s.month === '2025-05' && s.status === 'paid').reduce((sum, s) => sum + s.totalSalary, 0)

    return {
      projectCount: projects.length,
      totalWorkers,
      totalArea,
      totalInvestment,
      avgSafetyScore,
      avgProgress,
      totalDangers,
      pendingWorkOrders,
      salaryThisMonth,
      safetyAlertsCount: safetyAlerts.length
    }
  }, [projects, workers, safetyAlerts, workOrders, salaryRecords])

  const sortedBySafety = useMemo(() => {
    return [...projects].sort((a, b) => b.safetyScore - a.safetyScore)
  }, [projects])

  const sortedByProgress = useMemo(() => {
    return [...projects].sort((a, b) => b.progress - a.progress)
  }, [projects])

  const radarOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    legend: {
      data: projects.map(p => p.name),
      textStyle: { color: '#94a3b8' },
      top: 0
    },
    radar: {
      indicator: [
        { name: '安全评分', max: 100 },
        { name: '施工进度', max: 100 },
        { name: '人员管理', max: 100 },
        { name: '设备运行', max: 100 },
        { name: '工资发放', max: 100 },
        { name: '隐患整改', max: 100 }
      ],
      splitLine: { lineStyle: { color: '#334155' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(15, 23, 42, 0.3)', 'rgba(30, 41, 59, 0.3)']
        }
      },
      axisName: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    series: [
      {
        type: 'radar',
        data: projects.map((p, i) => ({
          value: [
            p.safetyScore,
            p.progress,
            85 + Math.random() * 15,
            80 + Math.random() * 20,
            90 + Math.random() * 10,
            75 + Math.random() * 25
          ],
          name: p.name,
          itemStyle: {
            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i]
          },
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)', 'rgba(239, 68, 68, 0.2)'][i]
          }
        }))
      }
    ]
  }

  const projectCompareOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    legend: {
      data: ['施工进度', '安全评分'],
      textStyle: { color: '#94a3b8' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: projects.map(p => p.name.length > 6 ? p.name.slice(0, 6) + '...' : p.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', interval: 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: '进度(%)',
        max: 100,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      {
        type: 'value',
        name: '评分',
        max: 100,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '施工进度',
        type: 'bar',
        data: projects.map(p => p.progress),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#3b82f6' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '安全评分',
        type: 'line',
        yAxisIndex: 1,
        data: projects.map(p => p.safetyScore),
        smooth: true,
        lineStyle: { color: '#10b981', width: 3 },
        itemStyle: { color: '#10b981' },
        symbol: 'circle',
        symbolSize: 10
      }
    ]
  }

  const projectColumns = [
    {
      title: '项目名称',
      key: 'name',
      width: 180,
      render: (_: any, record: Project) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <ApartmentOutlined className="text-white" />
          </div>
          <div>
            <div className="text-white font-medium">{record.name}</div>
            <div className="text-gray-400 text-xs">{record.manager}</div>
          </div>
        </div>
      )
    },
    {
      title: '项目地址',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      render: (text: string) => <span className="text-gray-300 text-sm">{text}</span>
    },
    {
      title: '总投资',
      dataIndex: 'totalInvestment',
      key: 'totalInvestment',
      width: 120,
      render: (val: number) => <span className="text-cyan-400 font-medium">¥{(val / 100000000).toFixed(1)}亿</span>
    },
    {
      title: '总建筑面积',
      dataIndex: 'totalArea',
      key: 'totalArea',
      width: 120,
      render: (val: number) => <span className="text-white">{(val / 10000).toFixed(1)}万㎡</span>
    },
    {
      title: '在场人数',
      dataIndex: 'workersCount',
      key: 'workersCount',
      width: 100,
      render: (val: number) => <span className="text-white">{val}人</span>
    },
    {
      title: '施工进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={val}
            size="small"
            strokeColor={val >= 80 ? '#22c55e' : val >= 50 ? '#eab308' : '#ef4444'}
            trailColor="#1e293b"
            style={{ width: 80 }}
          />
          <span className={`text-sm font-medium ${
            val >= 80 ? 'text-green-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {val}%
          </span>
        </div>
      )
    },
    {
      title: '安全评分',
      dataIndex: 'safetyScore',
      key: 'safetyScore',
      width: 120,
      render: (val: number) => (
        <div className={`text-lg font-bold ${
          val >= 90 ? 'text-green-400' : val >= 80 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {val}
          <span className="text-sm text-gray-400 font-normal">/100</span>
        </div>
      )
    },
    {
      title: '隐患数量',
      dataIndex: 'hiddenDangerCount',
      key: 'hiddenDangerCount',
      width: 100,
      render: (val: number) => (
        <span className={val > 10 ? 'text-red-400' : val > 5 ? 'text-yellow-400' : 'text-green-400'}>
          {val} 个
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'in-progress' ? 'green' : status === 'planning' ? 'blue' : 'gray'}>
          {status === 'in-progress' ? '进行中' : status === 'planning' ? '规划中' : '已完成'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedProject(record)
            setDetailModal(true)
          }}
        >
          详情
        </Button>
      )
    }
  ]

  const rolePermissions: Record<Role, { name: string; desc: string; permissions: string[] }> = {
    'worker': {
      name: '工人',
      desc: '一线作业人员，仅限查看个人相关信息',
      permissions: ['查看个人考勤', '查看工资记录', '查看培训记录', '查看个人证件', '查看通知公告']
    },
    'safety-officer': {
      name: '安全员',
      desc: '安全管理人员，负责现场安全管理和隐患整改',
      permissions: ['AI告警查看', '隐患处理', '现场巡检', '整改闭环', '安全报表查看', '安全教育培训']
    },
    'project-manager': {
      name: '项目经理',
      desc: '项目负责人，全面管理单个项目',
      permissions: ['进度管理', '人员管理', '审核审批', '隐患督办', '项目大屏', '报表导出', '工资审核']
    },
    'group-admin': {
      name: '集团工程部',
      desc: '集团管理员，可查看所有项目并进行合规审计',
      permissions: ['全项目查看', '进度监控', '安全分析', '预警监控', '报表导出', '合规审计', '权限管理', '系统配置']
    }
  }

  const operationLogs = useMemo(() => {
    const actions = [
      { user: '张经理', action: '审核通过工资发放', project: '智慧新城一期项目', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '安全员A', action: '关闭安全隐患工单', project: '滨江商务区办公楼', time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '李经理', action: '发起进度整改通知', project: '虹桥枢纽配套住宅', time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '系统管理员', action: '新增工人信息', project: '临港产业园标准厂房', time: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '安全员B', action: '处理AI安全预警', project: '智慧新城一期项目', time: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '王经理', action: '批量发放工资', project: '虹桥枢纽配套住宅', time: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '材料员A', action: '材料进场验收', project: '滨江商务区办公楼', time: dayjs().subtract(10, 'hour').format('YYYY-MM-DD HH:mm') },
      { user: '设备管理员', action: '塔机紧急停机', project: '临港产业园标准厂房', time: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm') }
    ]
    return actions
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">集团多级监管</h1>
          <p className="text-gray-400 mt-1">全项目统一监控 · 多维度数据分析 · 四级权限体系 · 合规审计追溯</p>
        </div>
        <Space>
          <Button icon={<FileTextOutlined />}>导出报表</Button>
          <Button type="primary" icon={<BarChartOutlined />}>综合分析</Button>
        </Space>
      </div>

      <Alert
        message="当前登录身份"
        description={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="text-white font-medium">{currentUser.name}</span>
            </div>
            <Tag color="purple">{currentUser.roleName}</Tag>
            <span className="text-gray-400 text-sm">{currentUser.department}</span>
          </div>
        }
        type="info"
        showIcon
        className="bg-blue-500/10 border-blue-500/30"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="在建项目数"
            value={groupStats.projectCount}
            icon={<ApartmentOutlined />}
            color="blue"
            subValue="总投资 43.7 亿"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="作业人员总数"
            value={groupStats.totalWorkers}
            icon={<TeamOutlined />}
            color="purple"
            subValue={`总建筑面积 ${(groupStats.totalArea / 10000).toFixed(0)}万㎡`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="平均安全评分"
            value={groupStats.avgSafetyScore}
            icon={<SafetyOutlined />}
            color="green"
            trend={groupStats.avgSafetyScore - 90}
            trendLabel="较上月"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="平均施工进度"
            value={`${groupStats.avgProgress}%`}
            icon={<BarChartOutlined />}
            color="cyan"
            subValue={`待处理隐患 ${groupStats.totalDangers} 个`}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="本月工资发放"
            value={`¥${(groupStats.salaryThisMonth / 10000).toFixed(0)}万`}
            icon={<DollarOutlined />}
            color="orange"
            trend={5.2}
            trendLabel="较上月"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="安全预警总数"
            value={groupStats.safetyAlertsCount}
            icon={<WarningOutlined />}
            color="red"
            subValue="待处理 23 条"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="待处理工单"
            value={groupStats.pendingWorkOrders}
            icon={<ClockCircleOutlined />}
            color="yellow"
            subValue="逾期 5 个"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="累计隐患整改"
            value="98.6%"
            icon={<CheckCircleOutlined />}
            color="green"
            trend={2.3}
            trendLabel="较上月"
          />
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="dark-tabs">
        <TabPane tab="项目总览" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">项目进度与安全对比</h3>
                </div>
                <ReactECharts option={projectCompareOption} style={{ height: '320px' }} theme="dark" />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">项目综合能力雷达图</h3>
                </div>
                <ReactECharts option={radarOption} style={{ height: '320px' }} theme="dark" />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">安全评分排名</h3>
                </div>
                <div className="space-y-4">
                  {sortedBySafety.map((p, index) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{p.name}</span>
                          <span className={`font-bold ${
                            p.safetyScore >= 90 ? 'text-green-400' : p.safetyScore >= 80 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {p.safetyScore}分
                          </span>
                        </div>
                        <Progress
                          percent={p.safetyScore}
                          showInfo={false}
                          size="small"
                          strokeColor={p.safetyScore >= 90 ? '#22c55e' : p.safetyScore >= 80 ? '#eab308' : '#ef4444'}
                          trailColor="#1e293b"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">施工进度排名</h3>
                </div>
                <div className="space-y-4">
                  {sortedByProgress.map((p, index) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{p.name}</span>
                          <span className={`font-bold ${
                            p.progress >= 80 ? 'text-green-400' : p.progress >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {p.progress}%
                          </span>
                        </div>
                        <Progress
                          percent={p.progress}
                          showInfo={false}
                          size="small"
                          strokeColor={p.progress >= 80 ? '#22c55e' : p.progress >= 50 ? '#eab308' : '#ef4444'}
                          trailColor="#1e293b"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="项目列表" key="projects">
          <Card className="panel" styles={{ body: { padding: '20px' } }}>
            <Table
              columns={projectColumns}
              dataSource={projects}
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="权限体系" key="permissions">
          <Row gutter={[16, 16]}>
            {(Object.entries(rolePermissions) as [Role, typeof rolePermissions[Role]][]).map(([role, data], index) => (
              <Col xs={24} md={12} lg={6} key={role}>
                <Card
                  className="panel h-full"
                  styles={{ body: { padding: '20px' } }}
                  style={{
                    borderTop: `3px solid ${['#64748b', '#3b82f6', '#f59e0b', '#8b5cf6'][index]}`
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      ['bg-slate-500/20', 'bg-blue-500/20', 'bg-amber-500/20', 'bg-purple-500/20'][index]
                    }`}>
                      <KeyOutlined className={`text-xl ${
                        ['text-slate-400', 'text-blue-400', 'text-amber-400', 'text-purple-400'][index]
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{data.name}</h3>
                      <p className="text-gray-400 text-xs">{data.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircleOutlined className={`text-sm ${
                          ['text-slate-400', 'text-blue-400', 'text-amber-400', 'text-purple-400'][index]
                        }`} />
                        <span className="text-gray-300">{perm}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Card className="panel mt-6" styles={{ body: { padding: '20px' } }}>
            <h3 className="text-white font-medium mb-4">权限数据隔离规则</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-2">横向数据隔离</h4>
                <p className="text-gray-300 text-sm">
                  不同项目之间的数据完全隔离，项目经理只能查看自己负责项目的数据，集团管理员可查看所有项目。
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-2">纵向权限控制</h4>
                <p className="text-gray-300 text-sm">
                  操作权限按角色逐级下放，上级可查看下级数据但不可越权操作，所有操作留痕可追溯。
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-2">操作审计</h4>
                <p className="text-gray-300 text-sm">
                  所有增删改操作永久记录，包含操作人、时间、IP、内容，满足监管审计要求。
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-2">数据防篡改</h4>
                <p className="text-gray-300 text-sm">
                  关键数据（过磅重量、考勤记录、工资发放等）不可删除、不可修改，仅可追加备注。
                </p>
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="操作日志" key="logs">
          <Card className="panel" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">系统操作日志</h3>
              <Space>
                <Select placeholder="筛选操作类型" className="w-40 bg-slate-800/50">
                  <Option value="all">全部类型</Option>
                  <Option value="audit">审核操作</Option>
                  <Option value="safety">安全操作</Option>
                  <Option value="personnel">人员操作</Option>
                  <Option value="system">系统操作</Option>
                </Select>
                <DatePicker className="bg-slate-800/50" />
              </Space>
            </div>
            <Timeline
              items={operationLogs.map((log, index) => ({
                color: ['blue', 'green', 'orange', 'purple', 'red', 'cyan', 'blue', 'green'][index],
                children: (
                  <div className="py-2">
                    <div className="flex items-center gap-3">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <span className="text-white font-medium">{log.user}</span>
                      <span className="text-gray-300">{log.action}</span>
                      <Tag color="purple">{log.project}</Tag>
                      <span className="text-gray-500 text-sm ml-auto">{log.time}</span>
                    </div>
                  </div>
                )
              }))}
            />
            <div className="text-center mt-6">
              <Button>加载更多</Button>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      <Card className="panel border-amber-500/30 bg-amber-500/5" styles={{ body: { padding: '16px' } }}>
        <div className="flex items-start gap-3">
          <WarningOutlined className="text-amber-400 text-xl mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium mb-2">核心规则 · 强约束</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                所有操作留痕、可追溯、不可删除，满足审计与监管要求
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                四级权限体系严格控制数据访问范围，禁止越权查看
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                集团可对所有项目进行监控、预警督办和合规审计
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                关键数据自动同步至监管部门（住建/人社），保障合规
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title="项目详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={900}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <ApartmentOutlined className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedProject.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color="green">进行中</Tag>
                    <span className="text-gray-400 text-sm">{selectedProject.address}</span>
                  </div>
                </div>
              </div>
              <Button type="primary">进入项目大屏</Button>
            </div>

            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">总投资</span>}
                  value={selectedProject.totalInvestment / 100000000}
                  precision={1}
                  suffix="亿"
                  className="statistic-dark"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">总建筑面积</span>}
                  value={selectedProject.totalArea / 10000}
                  precision={1}
                  suffix="万㎡"
                  className="statistic-dark"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="text-gray-400">项目经理</span>}
                  value={selectedProject.manager}
                  className="statistic-dark"
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '16px' } }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">施工进度</h4>
                    <span className={`text-xl font-bold ${
                      selectedProject.progress >= 80 ? 'text-green-400' :
                      selectedProject.progress >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {selectedProject.progress}%
                    </span>
                  </div>
                  <Progress
                    percent={selectedProject.progress}
                    strokeColor={selectedProject.progress >= 80 ? '#22c55e' : selectedProject.progress >= 50 ? '#eab308' : '#ef4444'}
                    trailColor="#1e293b"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>开工：{selectedProject.startDate}</span>
                    <span>计划竣工：{selectedProject.plannedEndDate}</span>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '16px' } }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">安全评分</h4>
                    <span className={`text-xl font-bold ${
                      selectedProject.safetyScore >= 90 ? 'text-green-400' :
                      selectedProject.safetyScore >= 80 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {selectedProject.safetyScore}<span className="text-sm font-normal text-gray-400">/100</span>
                    </span>
                  </div>
                  <Progress
                    percent={selectedProject.safetyScore}
                    strokeColor={selectedProject.safetyScore >= 90 ? '#22c55e' : selectedProject.safetyScore >= 80 ? '#eab308' : '#ef4444'}
                    trailColor="#1e293b"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>在场人数：{selectedProject.workersCount}人</span>
                    <span className="text-red-400">待整改隐患：{selectedProject.hiddenDangerCount}个</span>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '16px' } }}>
                  <h4 className="text-white font-medium mb-3">核心指标</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">今日进场人数</span>
                      <span className="text-white">{Math.floor(selectedProject.workersCount * 0.95)}人</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">本月安全预警</span>
                      <span className="text-orange-400">{Math.floor(10 + Math.random() * 20)}条</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">本月工资发放</span>
                      <span className="text-green-400">¥{Math.floor(150 + Math.random() * 100)}万</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">隐患整改率</span>
                      <span className="text-cyan-400">{(95 + Math.random() * 5).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">设备在线率</span>
                      <span className="text-green-400">{(98 + Math.random() * 2).toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '16px' } }}>
                  <h4 className="text-white font-medium mb-3">最近动态</h4>
                  <List
                    size="small"
                    dataSource={[
                      { time: '10分钟前', action: '安全员A 处理了一条安全预警', type: 'safety' },
                      { time: '1小时前', action: '3名工人完成进场登记', type: 'personnel' },
                      { time: '2小时前', action: '钢筋进场验收通过（42.5吨）', type: 'material' },
                      { time: '4小时前', action: '工资发放审核通过（128人）', type: 'salary' },
                      { time: '8小时前', action: '塔机完成月度安全检查', type: 'equipment' }
                    ]}
                    renderItem={(item) => (
                      <List.Item className="border-b border-gray-700/30 py-2">
                        <List.Item.Meta
                          title={
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm">{item.action}</span>
                              <Tag color={
                                item.type === 'safety' ? 'red' :
                                item.type === 'personnel' ? 'blue' :
                                item.type === 'material' ? 'green' :
                                item.type === 'salary' ? 'purple' : 'orange'
                              }>
                                {item.type === 'safety' ? '安全' :
                                 item.type === 'personnel' ? '人员' :
                                 item.type === 'material' ? '材料' :
                                 item.type === 'salary' ? '工资' : '设备'}
                              </Tag>
                            </div>
                          }
                          description={<span className="text-gray-500 text-xs">{item.time}</span>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}
