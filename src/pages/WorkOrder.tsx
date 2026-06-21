import { useState, useMemo, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Row, Col, Progress, List, Steps, Image, Upload, message, Timeline } from 'antd'
import { WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, SearchOutlined, PlusOutlined, UploadOutlined, SafetyOutlined, ToolOutlined, BarChartOutlined, UserOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import type { WorkOrder } from '@/types'
import { useSearchParams } from 'react-router-dom'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function WorkOrderPage() {
  const { workOrders, updateWorkOrderStatus, addWorkOrder } = useAppStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) setStatusFilter(filter)

    const detailId = searchParams.get('detailId')
    if (detailId) {
      const order = workOrders.find(o => o.id === detailId)
      if (order) {
        setCurrentOrder(order)
        setDetailModal(true)
      }
    }
  }, [searchParams, workOrders])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [detailModal, setDetailModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null)
  const [processModal, setProcessModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [form] = Form.useForm()
  const [processForm] = Form.useForm()
  const [reviewForm] = Form.useForm()

  const types = [
    { value: 'safety', label: '安全隐患', color: 'red' },
    { value: 'quality', label: '质量问题', color: 'orange' },
    { value: 'progress', label: '进度滞后', color: 'blue' },
    { value: 'equipment', label: '设备故障', color: 'purple' }
  ]

  const filteredOrders = useMemo(() => {
    return workOrders.filter(o => {
      const matchSearch = o.title.includes(searchText) || o.location.includes(searchText) || o.handler.includes(searchText)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchType = typeFilter === 'all' || o.type === typeFilter
      const matchLevel = levelFilter === 'all' || o.level === levelFilter
      return matchSearch && matchStatus && matchType && matchLevel
    })
  }, [workOrders, searchText, statusFilter, typeFilter, levelFilter])

  const stats = useMemo(() => {
    const pending = workOrders.filter(o => o.status === 'pending').length
    const processing = workOrders.filter(o => o.status === 'processing').length
    const reviewing = workOrders.filter(o => o.status === 'reviewing').length
    const closed = workOrders.filter(o => o.status === 'closed').length
    const overdue = workOrders.filter(o => o.status !== 'closed' && dayjs(o.deadline).isBefore(dayjs())).length
    const todayNew = workOrders.filter(o => dayjs(o.reportTime).isSame(dayjs(), 'day')).length

    const closedRate = workOrders.length > 0 ? Number(((closed / workOrders.length) * 100).toFixed(1)) : 0

    return {
      total: workOrders.length,
      pending,
      processing,
      reviewing,
      closed,
      overdue,
      todayNew,
      closedRate
    }
  }, [workOrders])

  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
    return days.map(day => {
      const dayOrders = workOrders.filter(o => dayjs(o.reportTime).format('MM-DD') === day)
      return {
        day,
        new: dayOrders.length,
        closed: dayOrders.filter(o => o.status === 'closed').length
      }
    })
  }, [workOrders])

  const typeStats = useMemo(() => {
    return types.map(t => ({
      type: t.value,
      name: t.label,
      color: t.color,
      count: workOrders.filter(o => o.type === t.value).length
    }))
  }, [workOrders])

  const levelStats = useMemo(() => {
    const levels = [
      { level: 'critical', name: '严重', color: '#ef4444' },
      { level: 'high', name: '高', color: '#f97316' },
      { level: 'medium', name: '中', color: '#eab308' },
      { level: 'low', name: '低', color: '#22c55e' }
    ]
    return levels.map(l => ({
      ...l,
      count: workOrders.filter(o => o.level === l.level).length
    }))
  }, [workOrders])

  const handlerStats = useMemo(() => {
    const map = new Map<string, { total: number; closed: number }>()
    workOrders.forEach(o => {
      if (!map.has(o.handler)) {
        map.set(o.handler, { total: 0, closed: 0 })
      }
      const data = map.get(o.handler)!
      data.total += 1
      if (o.status === 'closed') data.closed += 1
    })
    return Array.from(map.entries())
      .map(([handler, data]) => ({
        handler,
        total: data.total,
        closed: data.closed,
        rate: data.total > 0 ? Number(((data.closed / data.total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [workOrders])

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    legend: {
      data: ['新增工单', '闭环工单'],
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
      data: trendData.map(d => d.day),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [
      {
        name: '新增工单',
        type: 'bar',
        data: trendData.map(d => d.new),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f97316' },
              { offset: 1, color: '#ea580c' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '闭环工单',
        type: 'bar',
        data: trendData.map(d => d.closed),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  const typeChartOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: '{b}: {c}个 ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          color: '#e2e8f0',
          formatter: '{b}\n{c}个'
        },
        labelLine: { lineStyle: { color: '#64748b' } },
        data: typeStats.map(t => ({
          value: t.count,
          name: t.name,
          itemStyle: {
            color: t.color === 'red' ? '#ef4444' :
                   t.color === 'orange' ? '#f97316' :
                   t.color === 'blue' ? '#3b82f6' : '#8b5cf6'
          }
        }))
      }
    ]
  }

  const columns = [
    {
      title: '工单信息',
      key: 'info',
      width: 250,
      render: (_: any, record: WorkOrder) => (
        <div>
          <div className="text-white text-sm font-medium">{record.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <Tag color={
              record.type === 'safety' ? 'red' :
              record.type === 'quality' ? 'orange' :
              record.type === 'progress' ? 'blue' : 'purple'
            }>{record.typeName}</Tag>
            <StatusTag status={record.level} />
          </div>
        </div>
      )
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (text: string) => <span className="text-gray-300 text-sm">{text}</span>
    },
    {
      title: '上报人',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 100,
      render: (text: string) => <span className="text-white text-sm">{text}</span>
    },
    {
      title: '整改人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <UserOutlined className="text-purple-400 text-xs" />
          </div>
          <span className="text-white text-sm">{text}</span>
        </div>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string) => {
        const isOverdue = dayjs(date).isBefore(dayjs())
        return (
          <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
            {isOverdue && <WarningOutlined className="mr-1" />}
            {date}
          </span>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} type="workorder" />
    },
    {
      title: '上报时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 150,
      render: (time: string) => <span className="text-gray-400 text-xs">{time}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: WorkOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentOrder(record)
              setDetailModal(true)
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<ToolOutlined />}
              onClick={() => {
                setCurrentOrder(record)
                processForm.setFieldsValue({
                  rectification: ''
                })
                setProcessModal(true)
              }}
            >
              开始整改
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setCurrentOrder(record)
                processForm.setFieldsValue({
                  rectification: record.rectification || ''
                })
                setProcessModal(true)
              }}
            >
              提交整改
            </Button>
          )}
          {record.status === 'reviewing' && (
            <Button
              type="link"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => {
                setCurrentOrder(record)
                reviewForm.setFieldsValue({
                  reviewComment: ''
                })
                setReviewModal(true)
              }}
            >
              复查
            </Button>
          )}
        </Space>
      )
    }
  ]

  const handleProcess = () => {
    processForm.validateFields().then(values => {
      if (currentOrder) {
        if (currentOrder.status === 'pending') {
          updateWorkOrderStatus(currentOrder.id, 'processing', values.rectification)
          message.success('已开始整改')
        } else {
          updateWorkOrderStatus(currentOrder.id, 'reviewing', values.rectification)
          message.success('整改已提交，等待复查')
        }
        setProcessModal(false)
        processForm.resetFields()
      }
    })
  }

  const handleReview = (pass: boolean) => {
    reviewForm.validateFields().then(values => {
      if (currentOrder) {
        if (pass) {
          updateWorkOrderStatus(currentOrder.id, 'closed', currentOrder.rectification)
          message.success('复查通过，工单已闭环')
        } else {
          updateWorkOrderStatus(currentOrder.id, 'processing', currentOrder.rectification)
          message.warning('复查未通过，需重新整改')
        }
        setReviewModal(false)
        reviewForm.resetFields()
      }
    })
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      addWorkOrder({
        title: values.title,
        type: values.type,
        typeName: types.find(t => t.value === values.type)?.label || '',
        level: values.level,
        description: values.description,
        images: [],
        location: values.location,
        reporter: '当前用户',
        handler: values.handler,
        deadline: values.deadline?.format('YYYY-MM-DD') || dayjs().add(7, 'day').format('YYYY-MM-DD')
      })
      message.success('工单创建成功')
      setCreateModal(false)
      form.resetFields()
    })
  }

  const getStepStatus = (order: WorkOrder, step: number) => {
    if (step === 0) return 'finish'
    if (step === 1) return order.status !== 'pending' ? 'finish' : 'process'
    if (step === 2) return order.status === 'reviewing' || order.status === 'closed' ? 'finish' :
                     order.status === 'processing' ? 'process' : 'wait'
    if (step === 3) return order.status === 'closed' ? 'finish' : 'wait'
    return 'wait'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">隐患闭环整改</h1>
          <p className="text-gray-400 mt-1">发现 → 派单 → 处置 → 复查 → 闭环 · 全流程可追溯</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新建工单
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="今日新增"
            value={stats.todayNew}
            icon={<WarningOutlined />}
            color="orange"
            trend={stats.todayNew - 3}
            trendLabel="较昨日"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="待处理"
            value={stats.pending}
            icon={<ClockCircleOutlined />}
            color="red"
            subValue={`整改中 ${stats.processing} 个`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="待复查"
            value={stats.reviewing}
            icon={<SafetyOutlined />}
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="闭环率"
            value={`${stats.closedRate}%`}
            icon={<CheckCircleOutlined />}
            color="green"
            trend={stats.closedRate - 80}
            trendLabel="较上周"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">工单类型分布</h3>
            </div>
            <ReactECharts option={typeChartOption} style={{ height: '280px' }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">近7天工单趋势</h3>
            </div>
            <ReactECharts option={trendChartOption} style={{ height: '280px' }} theme="dark" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">严重等级分布</h3>
            </div>
            <div className="space-y-4">
              {levelStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="text-white">{item.count} 个</span>
                  </div>
                  <Progress
                    percent={(item.count / stats.total) * 100}
                    showInfo={false}
                    strokeColor={item.color}
                    trailColor="#1e293b"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">整改人完成率</h3>
            </div>
            <div className="space-y-3">
              {handlerStats.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {item.handler.slice(-1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{item.handler}</span>
                      <span className="text-gray-400">{item.closed}/{item.total}</span>
                    </div>
                    <Progress
                      percent={item.rate}
                      showInfo={false}
                      size="small"
                      strokeColor={item.rate >= 80 ? '#22c55e' : item.rate >= 60 ? '#eab308' : '#ef4444'}
                      trailColor="#1e293b"
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    item.rate >= 80 ? 'text-green-400' : item.rate >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {item.rate}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {stats.overdue > 0 && (
        <Card className="panel border-red-500/30 bg-red-500/5" styles={{ body: { padding: '16px' } }}>
          <div className="flex items-start gap-3">
            <WarningOutlined className="text-red-400 text-xl mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h4 className="text-red-400 font-medium mb-2">逾期预警</h4>
              <p className="text-gray-300 text-sm">
                共有 <span className="text-red-400 font-bold">{stats.overdue}</span> 个工单已超过整改截止日期，请立即督办！
              </p>
            </div>
            <Button type="primary" danger size="small">立即督办</Button>
          </div>
        </Card>
      )}

      <Card className="panel" styles={{ body: { padding: '20px' } }}>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h3 className="text-white font-medium">工单列表</h3>
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <Input
              placeholder="搜索工单标题/位置/整改人"
              prefix={<SearchOutlined className="text-gray-500" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-56 bg-slate-800/50 border-slate-600"
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-32 bg-slate-800/50"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待派单' },
                { value: 'processing', label: '整改中' },
                { value: 'reviewing', label: '复查中' },
                { value: 'closed', label: '已闭环' }
              ]}
            />
            <Select
              placeholder="类型筛选"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-32 bg-slate-800/50"
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'safety', label: '安全隐患' },
                { value: 'quality', label: '质量问题' },
                { value: 'progress', label: '进度滞后' },
                { value: 'equipment', label: '设备故障' }
              ]}
            />
            <Select
              placeholder="等级筛选"
              value={levelFilter}
              onChange={setLevelFilter}
              className="w-32 bg-slate-800/50"
              options={[
                { value: 'all', label: '全部等级' },
                { value: 'critical', label: '严重' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' }
              ]}
            />
            <RangePicker className="bg-slate-800/50" />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条工单`,
            className: 'mt-4'
          }}
        />
      </Card>

      <Card className="panel border-amber-500/30 bg-amber-500/5" styles={{ body: { padding: '16px' } }}>
        <div className="flex items-start gap-3">
          <WarningOutlined className="text-amber-400 text-xl mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium mb-2">核心规则 · 强约束</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                所有安全隐患必须生成工单，不可跳过闭环流程
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                整改完成后必须由安全员或项目经理复查通过后方可闭环
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                严重/高等级隐患必须在24小时内响应，72小时内整改完成
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                所有工单操作记录永久保留，可追溯、不可删除
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title="工单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={800}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentOrder && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{currentOrder.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Tag color={
                    currentOrder.type === 'safety' ? 'red' :
                    currentOrder.type === 'quality' ? 'orange' :
                    currentOrder.type === 'progress' ? 'blue' : 'purple'
                  }>{currentOrder.typeName}</Tag>
                  <StatusTag status={currentOrder.level} />
                  <StatusTag status={currentOrder.status} type="workorder" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">工单编号</div>
                <div className="text-cyan-400 font-mono">{currentOrder.id}</div>
              </div>
            </div>

            <Steps
              current={3}
              status={currentOrder.status === 'closed' ? 'finish' : 'process'}
              items={[
                { title: '发现上报', status: getStepStatus(currentOrder, 0) },
                { title: '派单整改', status: getStepStatus(currentOrder, 1) },
                { title: '提交复查', status: getStepStatus(currentOrder, 2) },
                { title: '闭环归档', status: getStepStatus(currentOrder, 3) }
              ]}
              className="py-4"
            />

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '12px' } }}>
                  <h4 className="text-white text-sm font-medium mb-3">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">位置</span>
                      <span className="text-white">{currentOrder.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">上报人</span>
                      <span className="text-white">{currentOrder.reporter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">上报时间</span>
                      <span className="text-white">{currentOrder.reportTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">整改人</span>
                      <span className="text-white">{currentOrder.handler}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">截止日期</span>
                      <span className={dayjs(currentOrder.deadline).isBefore(dayjs()) ? 'text-red-400' : 'text-white'}>
                        {currentOrder.deadline}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '12px' } }}>
                  <h4 className="text-white text-sm font-medium mb-3">问题描述</h4>
                  <p className="text-gray-300 text-sm">{currentOrder.description}</p>
                  {currentOrder.images && currentOrder.images.length > 0 && (
                    <div className="mt-3">
                      <div className="text-gray-400 text-xs mb-2">现场照片</div>
                      <Image.PreviewGroup>
                        <div className="flex gap-2 flex-wrap">
                          {currentOrder.images.map((img, i) => (
                            <Image key={i} width={60} height={60} src={img} className="rounded object-cover" />
                          ))}
                        </div>
                      </Image.PreviewGroup>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {currentOrder.rectification && (
              <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '12px' } }}>
                <h4 className="text-white text-sm font-medium mb-3">整改情况</h4>
                <p className="text-gray-300 text-sm">{currentOrder.rectification}</p>
                {currentOrder.rectificationTime && (
                  <div className="text-gray-400 text-xs mt-2">整改提交时间：{currentOrder.rectificationTime}</div>
                )}
                {currentOrder.rectificationImages && currentOrder.rectificationImages.length > 0 && (
                  <div className="mt-3">
                    <div className="text-gray-400 text-xs mb-2">整改后照片</div>
                    <Image.PreviewGroup>
                      <div className="flex gap-2 flex-wrap">
                        {currentOrder.rectificationImages.map((img, i) => (
                          <Image key={i} width={60} height={60} src={img} className="rounded object-cover" />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  </div>
                )}
              </Card>
            )}

            {currentOrder.reviewComment && (
              <Card size="small" className="bg-green-500/10 border-green-500/30" styles={{ body: { padding: '12px' } }}>
                <h4 className="text-green-400 text-sm font-medium mb-3">复查意见</h4>
                <p className="text-gray-300 text-sm">{currentOrder.reviewComment}</p>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-gray-400">复查人</span>
                  <span className="text-white">{currentOrder.reviewer}</span>
                </div>
                {currentOrder.reviewTime && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">复查时间</span>
                    <span className="text-white">{currentOrder.reviewTime}</span>
                  </div>
                )}
              </Card>
            )}

            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white text-sm font-medium mb-3">操作日志</h4>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <div className="text-white text-sm">工单创建</div>
                        <div className="text-gray-400 text-xs">{currentOrder.reportTime} · {currentOrder.reporter}</div>
                      </div>
                    )
                  },
                  currentOrder.status !== 'pending' ? {
                    color: 'blue',
                    children: (
                      <div>
                        <div className="text-white text-sm">开始整改</div>
                        <div className="text-gray-400 text-xs">{currentOrder.rectificationTime} · {currentOrder.handler}</div>
                      </div>
                    )
                  } : null,
                  (currentOrder.status === 'reviewing' || currentOrder.status === 'closed') ? {
                    color: 'orange',
                    children: (
                      <div>
                        <div className="text-white text-sm">提交复查</div>
                        <div className="text-gray-400 text-xs">{currentOrder.rectificationTime} · {currentOrder.handler}</div>
                      </div>
                    )
                  } : null,
                  currentOrder.status === 'closed' ? {
                    color: 'green',
                    children: (
                      <div>
                        <div className="text-white text-sm">复查通过，工单闭环</div>
                        <div className="text-gray-400 text-xs">{currentOrder.reviewTime} · {currentOrder.reviewer}</div>
                      </div>
                    )
                  } : null
                ].filter(Boolean) as any}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={currentOrder?.status === 'pending' ? '开始整改' : '提交整改'}
        open={processModal}
        onCancel={() => setProcessModal(false)}
        onOk={handleProcess}
        okText={currentOrder?.status === 'pending' ? '开始整改' : '提交复查'}
        width={600}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentOrder && (
          <div className="mb-4">
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
              <div className="text-white font-medium">{currentOrder.title}</div>
              <div className="text-gray-400 text-sm mt-1">{currentOrder.description}</div>
            </div>
            <Form form={processForm} layout="vertical">
              <Form.Item
                name="rectification"
                label={<span className="text-gray-300">整改措施</span>}
                rules={[{ required: true, message: '请输入整改措施' }]}
              >
                <TextArea rows={4} className="bg-slate-800/50 border-slate-600" placeholder="请详细描述整改措施..." />
              </Form.Item>
              <Form.Item label={<span className="text-gray-300">整改照片</span>}>
                <Upload
                  listType="picture-card"
                  multiple
                  beforeUpload={() => false}
                  className="upload-dark"
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                </Upload>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="复查验收"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={[
          <Button key="reject" onClick={() => handleReview(false)}>
            复查不通过
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleReview(true)}>
            复查通过
          </Button>
        ]}
        width={600}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentOrder && (
          <div className="mb-4">
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
              <div className="text-gray-400 text-xs mb-1">整改措施</div>
              <div className="text-white text-sm">{currentOrder.rectification}</div>
            </div>
            <Form form={reviewForm} layout="vertical">
              <Form.Item
                name="reviewComment"
                label={<span className="text-gray-300">复查意见</span>}
                rules={[{ required: true, message: '请输入复查意见' }]}
              >
                <TextArea rows={3} className="bg-slate-800/50 border-slate-600" placeholder="请输入复查意见..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="新建工单"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        okText="创建工单"
        width={600}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={<span className="text-gray-300">工单标题</span>}
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input className="bg-slate-800/50 border-slate-600" placeholder="请输入工单标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label={<span className="text-gray-300">工单类型</span>}
                rules={[{ required: true, message: '请选择工单类型' }]}
              >
                <Select className="bg-slate-800/50" placeholder="请选择">
                  {types.map(t => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="level"
                label={<span className="text-gray-300">严重等级</span>}
                rules={[{ required: true, message: '请选择严重等级' }]}
              >
                <Select className="bg-slate-800/50" placeholder="请选择">
                  <Option value="critical">严重</Option>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label={<span className="text-gray-300">位置</span>}
                rules={[{ required: true, message: '请输入位置' }]}
              >
                <Input className="bg-slate-800/50 border-slate-600" placeholder="如：1号楼东侧" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="handler"
                label={<span className="text-gray-300">整改人</span>}
                rules={[{ required: true, message: '请选择整改人' }]}
              >
                <Select className="bg-slate-800/50" placeholder="请选择">
                  {['班组长A', '班组长B', '班组长C', '分包负责人D'].map(h => (
                    <Option key={h} value={h}>{h}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="deadline"
            label={<span className="text-gray-300">截止日期</span>}
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker className="w-full bg-slate-800/50" placeholder="请选择截止日期" />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span className="text-gray-300">问题描述</span>}
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={4} className="bg-slate-800/50 border-slate-600" placeholder="请详细描述问题情况..." />
          </Form.Item>
          <Form.Item label={<span className="text-gray-300">现场照片</span>}>
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
              className="upload-dark"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
