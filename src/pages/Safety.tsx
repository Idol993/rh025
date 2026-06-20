import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Modal,
  Row,
  Col,
  Timeline,
  Image,
  Badge,
  Form,
  Input,
  Space,
  Steps,
  Tag
} from 'antd'
import {
  SafetyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  SoundOutlined,
  CameraOutlined,
  MessageOutlined,
  CloseCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'
import type { SafetyAlert } from '@/types'

const { Option } = Select
const { Step } = Steps

export default function Safety() {
  const { safetyAlerts, updateSafetyAlertStatus } = useAppStore()
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null)
  const [handlerForm] = Form.useForm()

  const alertTypes = useMemo(() => [...new Set(safetyAlerts.map(a => a.typeName))], [safetyAlerts])

  const filteredAlerts = useMemo(() => {
    return safetyAlerts.filter(a => {
      const matchLevel = levelFilter === 'all' || a.level === levelFilter
      const matchType = typeFilter === 'all' || a.typeName === typeFilter
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      return matchLevel && matchType && matchStatus
    })
  }, [safetyAlerts, levelFilter, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: safetyAlerts.length,
    today: safetyAlerts.filter(a => dayjs(a.captureTime).isSame(dayjs(), 'day')).length,
    pending: safetyAlerts.filter(a => a.status === 'pending').length,
    processing: safetyAlerts.filter(a => a.status === 'processing').length,
    resolved: safetyAlerts.filter(a => a.status === 'resolved').length,
    closed: safetyAlerts.filter(a => a.status === 'closed').length,
    critical: safetyAlerts.filter(a => a.level === 'critical').length,
    high: safetyAlerts.filter(a => a.level === 'high').length
  }), [safetyAlerts])

  const hourTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      name: '预警次数',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [{
      type: 'line',
      smooth: true,
      data: [2, 1, 0, 0, 0, 1, 3, 5, 4, 6, 3, 2, 4, 5, 3, 4, 2, 3, 1, 2, 0, 1, 0, 2],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 34, 45, 0.4)' },
            { offset: 1, color: 'rgba(245, 34, 45, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#f5222d', width: 2 },
      itemStyle: { color: '#f5222d' }
    }]
  }

  const locationOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'treemap',
      width: '100%',
      height: '100%',
      data: [
        { name: '1号楼', value: 25, itemStyle: { color: '#1890ff' } },
        { name: '2号楼', value: 18, itemStyle: { color: '#52c41a' } },
        { name: '3号楼', value: 22, itemStyle: { color: '#faad14' } },
        { name: '4号楼', value: 12, itemStyle: { color: '#722ed1' } },
        { name: '基坑区域', value: 8, itemStyle: { color: '#13c2c2' } },
        { name: '钢筋加工区', value: 5, itemStyle: { color: '#eb2f96' } },
        { name: '其他区域', value: 10, itemStyle: { color: '#fa8c16' } }
      ],
      label: {
        show: true,
        color: '#fff',
        fontSize: 12
      },
      breadcrumb: { show: false }
    }]
  }

  const handleView = (alert: SafetyAlert) => {
    setSelectedAlert(alert)
    setModalVisible(true)
    if (alert.status === 'pending') {
      handlerForm.resetFields()
    }
  }

  const handleProcess = (status: SafetyAlert['status']) => {
    if (selectedAlert && status === 'processing') {
      handlerForm.validateFields().then(values => {
        updateSafetyAlertStatus(selectedAlert.id, status, values.handler)
        setModalVisible(false)
      })
    } else if (selectedAlert) {
      updateSafetyAlertStatus(selectedAlert.id, status, selectedAlert.handler || '系统自动处理')
      setModalVisible(false)
    }
  }

  const columns = [
    {
      title: '抓拍图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) => (
        <Image
          width={100}
          height={70}
          src={url}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      )
    },
    {
      title: '预警类型',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 150,
      render: (text: string, record: SafetyAlert) => (
        <div className="flex items-center gap-2">
          {record.type === 'fire' ? <BellOutlined className="text-red-400" /> :
           record.type === 'helmet' ? <WarningOutlined className="text-yellow-400" /> :
           record.type === 'vest' ? <ExclamationCircleOutlined className="text-blue-400" /> :
           record.type === 'safety-belt' ? <ExclamationCircleOutlined className="text-orange-400" /> :
           <WarningOutlined className="text-red-400" />}
          <span className="text-white">{text}</span>
        </div>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => <StatusTag status={level} />
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: '摄像头',
      dataIndex: 'cameraId',
      key: 'cameraId',
      width: 120
    },
    {
      title: '抓拍时间',
      dataIndex: 'captureTime',
      key: 'captureTime',
      width: 180
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} type="alert" />
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (text?: string) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: SafetyAlert) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详情
        </Button>
      )
    }
  ]

  const alertSteps = selectedAlert && [
    {
      title: 'AI识别抓拍',
      description: selectedAlert.captureTime,
      status: 'finish' as const,
      icon: <CameraOutlined />
    },
    {
      title: '现场语音告警',
      description: '已自动播放语音警告',
      status: 'finish' as const,
      icon: <SoundOutlined />
    },
    {
      title: '推送安全员APP',
      description: selectedAlert.status !== 'pending' ? '已推送至' + selectedAlert.handler : '待处理',
      status: selectedAlert.status !== 'pending' ? ('finish' as const) : ('process' as const),
      icon: <MessageOutlined />
    },
    {
      title: '生成隐患工单',
      description: selectedAlert.status === 'resolved' || selectedAlert.status === 'closed' ? '工单已闭环' : '处理中',
      status: 
        selectedAlert.status === 'resolved' || selectedAlert.status === 'closed' ? ('finish' as const) :
        selectedAlert.status === 'processing' ? ('process' as const) : ('wait' as const),
      icon: <SafetyOutlined />
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-cyan-300 glow-text flex items-center gap-2">
          <SafetyOutlined /> AI安全智能监管
        </h2>
        <Space>
          <Badge count={stats.critical} size="small" offset={[-5, 5]}>
            <Tag color="red">严重: {stats.critical}</Tag>
          </Badge>
          <Badge count={stats.high} size="small" offset={[-5, 5]}>
            <Tag color="orange">高危: {stats.high}</Tag>
          </Badge>
          <Tag color="yellow">待处理: {stats.pending}</Tag>
        </Space>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30">
        <div className="flex items-center gap-3">
          <WarningOutlined className="text-red-400 text-xl animate-pulse" />
          <div className="flex-1">
            <div className="text-white font-medium">核心规则执行中</div>
            <div className="text-sm text-gray-400">
              AI识别违规自动抓拍 → 现场语音告警 → 推送安全员APP → 生成隐患工单，四步动作不可跳过
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm flex items-center gap-1">
              <CheckCircleOutlined /> 实时执行中
            </span>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="总预警数" value={stats.total} unit="条" icon={<WarningOutlined />} color="cyan" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="今日预警" value={stats.today} unit="条" icon={<BellOutlined />} color="red" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="待处理" value={stats.pending} unit="条" icon={<ExclamationCircleOutlined />} color="yellow" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="处理中" value={stats.processing} unit="条" icon={<MessageOutlined />} color="blue" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="已解决" value={stats.resolved} unit="条" icon={<CheckCircleOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="已闭环" value={stats.closed} unit="条" icon={<CloseCircleOutlined />} color="green" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="panel" title={<span className="panel-title"><BellOutlined /> 24小时预警趋势</span>} bordered={false}>
            <ReactECharts option={hourTrendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="panel" title={<span className="panel-title"><CameraOutlined /> 各区域预警分布</span>} bordered={false}>
            <ReactECharts option={locationOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card className="panel" bordered={false}>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            placeholder="风险等级"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={levelFilter === 'all' ? undefined : levelFilter}
            onChange={(v) => setLevelFilter(v || 'all')}
          >
            <Option value="low">低风险</Option>
            <Option value="medium">中风险</Option>
            <Option value="high">高风险</Option>
            <Option value="critical">严重风险</Option>
          </Select>
          <Select
            placeholder="预警类型"
            allowClear
            size="large"
            style={{ width: 180 }}
            value={typeFilter === 'all' ? undefined : typeFilter}
            onChange={(v) => setTypeFilter(v || 'all')}
          >
            {alertTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
          <Select
            placeholder="处理状态"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={statusFilter === 'all' ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已闭环</Option>
          </Select>
        </div>

        <div className="mb-2 text-sm text-gray-400">
          共 {filteredAlerts.length} 条记录
        </div>

        <Table
          columns={columns}
          dataSource={filteredAlerts}
          rowKey="id"
          scroll={{ x: 1200 }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="预警详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={selectedAlert?.status === 'pending' ? [
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="process" type="primary" danger onClick={() => handleProcess('processing')}>
            开始处理
          </Button>
        ] : selectedAlert?.status === 'processing' ? [
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="resolve" type="primary" onClick={() => handleProcess('resolved')}>
            标记已解决
          </Button>
        ] : selectedAlert?.status === 'resolved' ? [
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="close" type="primary" onClick={() => handleProcess('closed')}>
            闭环关闭
          </Button>
        ] : null}
        width={900}
      >
        {selectedAlert && (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={12}>
                <Image
                  width="100%"
                  src={selectedAlert.imageUrl}
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col span={12}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-white">{selectedAlert.typeName}</span>
                        <StatusTag status={selectedAlert.level} />
                      </div>
                      <div className="text-gray-400">{selectedAlert.description}</div>
                    </div>
                    <StatusTag status={selectedAlert.status} type="alert" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">位置:</span>
                      <span className="text-white">{selectedAlert.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">摄像头:</span>
                      <span className="text-white">{selectedAlert.cameraId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">抓拍时间:</span>
                      <span className="text-white">{selectedAlert.captureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">处理人:</span>
                      <span className="text-white">{selectedAlert.handler || '-'}</span>
                    </div>
                  </div>

                  {selectedAlert.status === 'pending' && (
                    <Form form={handlerForm}>
                      <Form.Item
                        name="handler"
                        label="指定处理人"
                        rules={[{ required: true, message: '请选择处理人' }]}
                      >
                        <Select placeholder="请选择安全员">
                          <Option value="安全员A">安全员A</Option>
                          <Option value="安全员B">安全员B</Option>
                          <Option value="安全员C">安全员C</Option>
                        </Select>
                      </Form.Item>
                    </Form>
                  )}
                </div>
              </Col>
            </Row>

            <div className="pt-4 border-t border-border-glow">
              <div className="text-cyan-300 font-medium mb-4">处置流程</div>
              <Steps
                direction="vertical"
                current={selectedAlert.status === 'pending' ? 2 : 
                         selectedAlert.status === 'processing' ? 3 :
                         selectedAlert.status === 'resolved' ? 3 : 4}
                size="small"
              >
                {alertSteps?.map((step, index) => (
                  <Step key={index} {...step} />
                ))}
              </Steps>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <ExclamationCircleOutlined className="text-red-400 mt-0.5" />
                <div>
                  <div className="text-red-400 font-medium">AI智能识别规则</div>
                  <div className="text-sm text-gray-400 mt-1">
                    本预警由AI摄像头7×24小时自动识别，识别准确率99.8%，已自动抓拍取证、现场语音告警并推送至安全员。
                    请按照"发现-预警-派单-处置-复查-闭环"流程处理。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
