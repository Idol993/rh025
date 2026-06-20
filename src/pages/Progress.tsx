import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Modal,
  Row,
  Col,
  Progress as AntProgress,
  Descriptions,
  Tabs,
  Tag,
  Alert,
  Space
} from 'antd'
import {
  RiseOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  BuildOutlined,
  CameraOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'
import type { ProgressTask } from '@/types'

const { Option } = Select
const { TabPane } = Tabs

export default function Progress() {
  const { progressTasks } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [buildingFilter, setBuildingFilter] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ProgressTask | null>(null)

  const buildings = useMemo(() => [...new Set(progressTasks.map(t => t.building))], [progressTasks])

  const filteredTasks = useMemo(() => {
    return progressTasks.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchBuilding = buildingFilter === 'all' || t.building === buildingFilter
      return matchStatus && matchBuilding
    })
  }, [progressTasks, statusFilter, buildingFilter])

  const stats = useMemo(() => {
    const totalVolume = progressTasks.reduce((sum, t) => sum + t.plannedVolume, 0)
    const completedVolume = progressTasks.reduce((sum, t) => sum + t.actualVolume, 0)
    return {
      total: progressTasks.length,
      completed: progressTasks.filter(t => t.status === 'completed').length,
      inProgress: progressTasks.filter(t => t.status === 'in-progress').length,
      delayed: progressTasks.filter(t => t.status === 'delayed').length,
      notStarted: progressTasks.filter(t => t.status === 'not-started').length,
      critical: progressTasks.filter(t => t.isCritical).length,
      overallProgress: Number((completedVolume / totalVolume * 100).toFixed(1))
    }
  }, [progressTasks])

  const sCurveOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['计划进度', '实际进度'],
      textStyle: { color: '#8fa3b8' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'],
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      name: '完成率(%)',
      max: 100,
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '计划进度',
        type: 'line',
        smooth: true,
        data: [5, 12, 22, 35, 48, 55, 62, 70, 78, 85, 92, 100],
        lineStyle: { color: '#faad14', width: 3, type: 'dashed' },
        itemStyle: { color: '#faad14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.2)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.02)' }
            ]
          }
        }
      },
      {
        name: '实际进度',
        type: 'line',
        smooth: true,
        data: [5, 10, 18, 30, 42, 50, 52, 58, 62, 68, 75, 85],
        lineStyle: { color: '#1890ff', width: 3 },
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        markLine: {
          silent: true,
          data: [{ xAxis: 6, lineStyle: { color: '#f5222d', type: 'solid' } }],
          label: { formatter: '当前', color: '#f5222d' }
        }
      }
    ]
  }

  const ganttOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'category',
      data: progressTasks.slice(0, 8).map(t => t.name).reverse(),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8', fontSize: 11 }
    },
    series: progressTasks.slice(0, 8).map((task, index) => ({
      type: 'bar',
      data: [[
        dayjs(task.plannedStart).toDate(),
        dayjs(task.plannedEnd).toDate(),
        task.name,
        task.status
      ]],
      itemStyle: {
        color: task.status === 'completed' ? '#52c41a' :
               task.status === 'delayed' ? '#f5222d' :
               task.status === 'in-progress' ? '#1890ff' : '#8c8c8c'
      },
      barWidth: 20
    }))
  }

  const deviationOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: progressTasks.filter(t => t.progress > 0 && t.progress < 100).map(t => t.name.substring(0, 6) + '...'),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8', rotate: 30, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '偏差(天)',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [{
      type: 'bar',
      data: progressTasks.filter(t => t.progress > 0 && t.progress < 100).map(t => {
        const planDays = dayjs(t.plannedEnd).diff(dayjs(t.plannedStart), 'day')
        const actualDays = t.actualStart ? dayjs().diff(dayjs(t.actualStart), 'day') : 0
        const expectedProgress = Math.min(actualDays / planDays * 100, 100)
        const deviation = (t.progress - expectedProgress) / 100 * planDays
        return Math.round(deviation)
      }),
      itemStyle: {
        color: (params: any) => params.value < 0 ? '#f5222d' : '#52c41a'
      }
    }]
  }

  const buildingProgress = useMemo(() => {
    return buildings.map(building => {
      const tasks = progressTasks.filter(t => t.building === building)
      const totalVol = tasks.reduce((sum, t) => sum + t.plannedVolume, 0)
      const actualVol = tasks.reduce((sum, t) => sum + t.actualVolume, 0)
      return {
        building,
        progress: Number((actualVol / totalVol * 100).toFixed(1)),
        tasks: tasks.length
      }
    })
  }, [progressTasks, buildings])

  const handleView = (task: ProgressTask) => {
    setSelectedTask(task)
    setModalVisible(true)
  }

  const columns = [
    {
      title: 'WBS编码',
      dataIndex: 'wbsCode',
      key: 'wbsCode',
      width: 120,
      render: (code: string) => <span className="font-mono text-cyan-300">{code}</span>
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: ProgressTask) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white">{text}</span>
            {record.isCritical && <Tag color="red">关键线路</Tag>}
          </div>
          <div className="text-xs text-gray-400">{record.building} {record.floor}层</div>
        </div>
      )
    },
    {
      title: '计划工期',
      key: 'plan',
      width: 200,
      render: (_: any, record: ProgressTask) => (
        <div className="text-sm">
          <div className="text-gray-300">{record.plannedStart} ~ {record.plannedEnd}</div>
          <div className="text-gray-400 text-xs">
            {dayjs(record.plannedEnd).diff(dayjs(record.plannedStart), 'day')} 天
          </div>
        </div>
      )
    },
    {
      title: '实际进度',
      key: 'progress',
      width: 180,
      render: (_: any, record: ProgressTask) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AntProgress 
              percent={record.progress} 
              size="small"
              strokeColor={
                record.status === 'delayed' ? '#f5222d' :
                record.status === 'completed' ? '#52c41a' : '#1890ff'
              }
              showInfo={false}
              style={{ flex: 1 }}
            />
            <span className={`text-sm font-bold ${
              record.status === 'delayed' ? 'text-red-400' :
              record.status === 'completed' ? 'text-green-400' : 'text-cyan-400'
            }`}>
              {record.progress}%
            </span>
          </div>
          <div className="text-xs text-gray-400">
            工程量: {record.actualVolume.toFixed(0)} / {record.plannedVolume.toFixed(0)} m³
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} type="task" />
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: ProgressTask) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-cyan-300 glow-text flex items-center gap-2">
          <RiseOutlined /> 施工进度智能对比
        </h2>
        <Space>
          <Tag color="red">滞后: {stats.delayed}</Tag>
          <Tag color="blue">进行中: {stats.inProgress}</Tag>
          <Tag color="green">已完成: {stats.completed}</Tag>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<FileSearchOutlined />}
        message="BIM + AI 进度自动对比"
        description="系统导入BIM模型和计划WBS，通过现场摄像头和巡检拍照，AI自动识别施工部位，计算进度偏差和工程量偏差，关键线路延误自动预警。"
        className="bg-blue-500/10 border-blue-500/30"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="总任务数" value={stats.total} unit="项" icon={<ScheduleOutlined />} color="cyan" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="关键线路" value={stats.critical} unit="项" icon={<WarningOutlined />} color="red" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="整体进度" value={stats.overallProgress} unit="%" icon={<BarChartOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="滞后任务" value={stats.delayed} unit="项" icon={<ClockCircleOutlined />} color="red" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="进行中" value={stats.inProgress} unit="项" icon={<BuildOutlined />} color="blue" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="已完成" value={stats.completed} unit="项" icon={<CheckCircleOutlined />} color="green" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><BuildOutlined /> 各楼栋进度</span>} bordered={false}>
            <div className="space-y-4">
              {buildingProgress.map((item, index) => (
                <div key={item.building}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">{item.building}</span>
                    <span className="text-cyan-300 font-mono">{item.progress}%</span>
                  </div>
                  <AntProgress 
                    percent={item.progress} 
                    showInfo={false}
                    strokeColor={['#1890ff', '#52c41a', '#722ed1', '#13c2c2'][index % 4]}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={18}>
          <Card className="panel" title={<span className="panel-title"><BarChartOutlined /> S曲线进度对比</span>} bordered={false}>
            <ReactECharts option={sCurveOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card className="panel" title={<span className="panel-title"><ScheduleOutlined /> 进度偏差分析</span>} bordered={false}>
            <ReactECharts option={deviationOption} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Card className="panel" bordered={false}>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            placeholder="任务状态"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={statusFilter === 'all' ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
          >
            <Option value="not-started">未开始</Option>
            <Option value="in-progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="delayed">已滞后</Option>
          </Select>
          <Select
            placeholder="楼栋筛选"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={buildingFilter === 'all' ? undefined : buildingFilter}
            onChange={(v) => setBuildingFilter(v || 'all')}
          >
            {buildings.map(b => <Option key={b} value={b}>{b}</Option>)}
          </Select>
        </div>

        <Tabs defaultActiveKey="table">
          <TabPane tab="任务列表" key="table">
            <div className="mb-2 text-sm text-gray-400">
              共 {filteredTasks.length} 条记录
            </div>
            <Table
              columns={columns}
              dataSource={filteredTasks}
              rowKey="id"
              scroll={{ x: 1000 }}
              size="middle"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </TabPane>
          <TabPane tab="甘特图" key="gantt">
            <ReactECharts option={ganttOption} style={{ height: 400 }} />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="任务详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedTask.status === 'completed' ? 'bg-green-500/20' :
                selectedTask.status === 'delayed' ? 'bg-red-500/20' : 'bg-blue-500/20'
              }`}>
                <ScheduleOutlined className={`text-2xl ${
                  selectedTask.status === 'completed' ? 'text-green-400' :
                  selectedTask.status === 'delayed' ? 'text-red-400' : 'text-blue-400'
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTask.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-cyan-400">{selectedTask.wbsCode}</span>
                  <StatusTag status={selectedTask.status} type="task" />
                  {selectedTask.isCritical && <Tag color="red">关键线路</Tag>}
                </div>
              </div>
            </div>

            <Descriptions column={2} bordered size="small" className="text-sm">
              <Descriptions.Item label="所属楼栋">{selectedTask.building}</Descriptions.Item>
              <Descriptions.Item label="所在楼层">{selectedTask.floor}层</Descriptions.Item>
              <Descriptions.Item label="计划开始">{selectedTask.plannedStart}</Descriptions.Item>
              <Descriptions.Item label="计划结束">{selectedTask.plannedEnd}</Descriptions.Item>
              <Descriptions.Item label="实际开始">{selectedTask.actualStart || '-'}</Descriptions.Item>
              <Descriptions.Item label="实际结束">{selectedTask.actualEnd || '-'}</Descriptions.Item>
              <Descriptions.Item label="计划工程量">
                <span className="font-mono">{selectedTask.plannedVolume.toFixed(2)} m³</span>
              </Descriptions.Item>
              <Descriptions.Item label="实际工程量">
                <span className="font-mono text-cyan-300">{selectedTask.actualVolume.toFixed(2)} m³</span>
              </Descriptions.Item>
            </Descriptions>

            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300">完成进度</span>
                <span className={`text-2xl font-bold ${
                  selectedTask.status === 'delayed' ? 'text-red-400' :
                  selectedTask.status === 'completed' ? 'text-green-400' : 'text-cyan-400'
                }`}>
                  {selectedTask.progress}%
                </span>
              </div>
              <AntProgress 
                percent={selectedTask.progress} 
                strokeColor={
                  selectedTask.status === 'delayed' ? '#f5222d' :
                  selectedTask.status === 'completed' ? '#52c41a' : '#1890ff'
                }
                strokeWidth={12}
              />
            </div>

            {selectedTask.status === 'delayed' && (
              <Alert
                type="warning"
                showIcon
                message="进度滞后预警"
                description="关键线路任务进度滞后，请立即采取赶工措施，项目经理已收到预警通知。"
                className="bg-yellow-500/10 border-yellow-500/30"
              />
            )}

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <CameraOutlined /> AI进度识别
              </div>
              <div className="text-sm text-gray-400">
                本任务进度通过现场摄像头AI图像识别自动计算，最近一次识别时间：{dayjs().format('YYYY-MM-DD HH:mm')}，
                识别置信度：98.5%。进度数据每2小时自动更新，支持手动修正。
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
