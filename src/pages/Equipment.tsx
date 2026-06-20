import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Modal,
  Row,
  Col,
  Progress,
  Descriptions,
  Badge,
  Tag,
  Space
} from 'antd'
import {
  ToolOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  DashboardOutlined,
  RiseOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'
import type { Equipment } from '@/types'

const { Option } = Select

export default function Equipment() {
  const { equipment } = useAppStore()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  const types = useMemo(() => [...new Set(equipment.map(e => e.typeName))], [equipment])

  const filteredEquipment = useMemo(() => {
    return equipment.filter(e => {
      const matchType = typeFilter === 'all' || e.typeName === typeFilter
      const matchStatus = statusFilter === 'all' || e.status === statusFilter
      return matchType && matchStatus
    })
  }, [equipment, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: equipment.length,
    running: equipment.filter(e => e.status === 'running').length,
    warning: equipment.filter(e => e.status === 'warning').length,
    danger: equipment.filter(e => e.status === 'danger').length,
    offline: equipment.filter(e => e.status === 'offline').length
  }), [equipment])

  const loadOption = (eq: Equipment) => ({
    tooltip: { formatter: '{a} <br/>{b}: {c}%' },
    series: [{
      name: '载重',
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: eq.load / eq.maxLoad > 0.9 ? '#f5222d' : 
               eq.load / eq.maxLoad > 0.7 ? '#faad14' : '#52c41a'
      },
      progress: { show: true, width: 18, roundCap: true },
      pointer: { show: false },
      axisLine: {
        lineStyle: { width: 18, color: [[1, 'rgba(24, 144, 255, 0.1)']] },
        roundCap: true
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        width: '60%',
        lineHeight: 30,
        offsetCenter: [0, '20%'],
        fontSize: 18,
        fontWeight: 'bold',
        formatter: `{value}%`,
        color: eq.load / eq.maxLoad > 0.9 ? '#f5222d' : 
               eq.load / eq.maxLoad > 0.7 ? '#faad14' : '#52c41a'
      },
      data: [{ value: Math.round(eq.load / eq.maxLoad * 100), name: '载重率' }]
    }]
  })

  const realtimeTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['载重', '力矩', '风速'],
      textStyle: { color: '#8fa3b8' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 20 }, (_, i) => `${i * 3}s`),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '载重',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 20 }, () => 3 + Math.random() * 3),
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '力矩',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 20 }, () => 40 + Math.random() * 30),
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '风速',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 20 }, () => 2 + Math.random() * 4),
        lineStyle: { color: '#faad14', width: 2 },
        itemStyle: { color: '#faad14' }
      }
    ]
  }

  const handleView = (eq: Equipment) => {
    setSelectedEquipment(eq)
    setModalVisible(true)
  }

  const handleEmergencyStop = () => {
    Modal.confirm({
      title: '确认紧急停机',
      content: '此操作将立即切断设备电源/锁机，确保现场人员已撤离。是否继续？',
      okText: '确认停机',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        console.log('紧急停机')
      }
    })
  }

  const columns = [
    {
      title: '设备信息',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: Equipment) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            record.type === 'tower-crane' ? 'bg-blue-500/20' :
            record.type === 'elevator' ? 'bg-green-500/20' : 'bg-purple-500/20'
          }`}>
            {record.type === 'tower-crane' ? <RiseOutlined className="text-blue-400" /> :
             record.type === 'elevator' ? <ArrowUpOutlined className="text-green-400" /> :
             <DashboardOutlined className="text-purple-400" />}
          </div>
          <div>
            <div className="text-white font-medium">{text}</div>
            <div className="text-xs text-gray-400">{record.model} · {record.id}</div>
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 120
    },
    {
      title: '载重',
      key: 'load',
      width: 150,
      render: (_: any, record: Equipment) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">{record.load}/{record.maxLoad} 吨</span>
            <span className={`text-sm font-bold ${
              record.load / record.maxLoad > 0.9 ? 'text-red-400' : 
              record.load / record.maxLoad > 0.7 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {Math.round(record.load / record.maxLoad * 100)}%
            </span>
          </div>
          <Progress 
            percent={Math.round(record.load / record.maxLoad * 100)} 
            showInfo={false}
            size="small"
            strokeColor={
              record.load / record.maxLoad > 0.9 ? '#f5222d' : 
              record.load / record.maxLoad > 0.7 ? '#faad14' : '#52c41a'
            }
          />
        </div>
      )
    },
    {
      title: '高度',
      dataIndex: 'height',
      key: 'height',
      width: 100,
      render: (h: number) => <span className="text-white font-mono">{h} m</span>
    },
    {
      title: '风速',
      dataIndex: 'windSpeed',
      key: 'windSpeed',
      width: 100,
      render: (w: number) => (
        <span className={`font-mono ${w > 6 ? 'text-red-400' : w > 4 ? 'text-yellow-400' : 'text-green-400'}`}>
          {w} m/s
        </span>
      )
    },
    {
      title: '限位状态',
      dataIndex: 'limitStatus',
      key: 'limitStatus',
      width: 120,
      render: (status: string) => (
        <Tag color={status === '正常' ? 'green' : status.includes('预警') ? 'orange' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150
    },
    {
      title: '司机',
      dataIndex: 'operator',
      key: 'operator',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} type="equipment" />
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Equipment) => (
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
          <ToolOutlined /> 特种设备物联监测
        </h2>
        <Space>
          <Badge count={stats.danger} size="small">
            <Tag color="red">危险: {stats.danger}</Tag>
          </Badge>
          <Badge count={stats.warning} size="small">
            <Tag color="orange">预警: {stats.warning}</Tag>
          </Badge>
          <Tag color="green">运行: {stats.running}/{stats.total}</Tag>
        </Space>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30">
        <div className="flex items-center gap-3">
          <SafetyOutlined className="text-orange-400 text-xl animate-pulse" />
          <div className="flex-1">
            <div className="text-white font-medium">安全保护机制运行中</div>
            <div className="text-sm text-gray-400">
              超载、超力矩、倾斜超标、碰撞风险自动预警，达到危险阈值自动执行断电/锁机/断油保护。黑匣子数据不可篡改，支持事故追溯。
            </div>
          </div>
          <Button danger size="small" icon={<ThunderboltOutlined />} onClick={handleEmergencyStop}>
            紧急停机
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="设备总数" value={stats.total} unit="台" icon={<ToolOutlined />} color="cyan" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="正常运行" value={stats.running} unit="台" icon={<CheckCircleOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="预警状态" value={stats.warning} unit="台" icon={<WarningOutlined />} color="yellow" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="危险状态" value={stats.danger} unit="台" icon={<ExclamationCircleOutlined />} color="red" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {equipment.map((eq) => (
          <Col xs={24} md={12} lg={8} key={eq.id}>
            <Card 
              className={`panel transition-all hover:border-2 ${
                eq.status === 'danger' ? 'border-red-500/50 animate-pulse' :
                eq.status === 'warning' ? 'border-yellow-500/50' : 'border-border-glow'
              }`}
              bordered={false}
              size="small"
              actions={[
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(eq)}>
                  查看详情
                </Button>
              ]}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    eq.type === 'tower-crane' ? 'bg-blue-500/20' :
                    eq.type === 'elevator' ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    {eq.type === 'tower-crane' ? <RiseOutlined className="text-blue-400 text-xl" /> :
                     eq.type === 'elevator' ? <ArrowUpOutlined className="text-green-400 text-xl" /> :
                     <DashboardOutlined className="text-purple-400 text-xl" />}
                  </div>
                  <div>
                    <div className="text-white font-bold">{eq.name}</div>
                    <div className="text-xs text-gray-400">{eq.typeName} · {eq.model}</div>
                  </div>
                </div>
                <StatusTag status={eq.status} type="equipment" />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded bg-white/5">
                  <div className="text-xl font-bold text-cyan-300 font-mono">{eq.height}</div>
                  <div className="text-xs text-gray-400">高度 (m)</div>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <div className={`text-xl font-bold font-mono ${
                    eq.windSpeed > 6 ? 'text-red-400' : eq.windSpeed > 4 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{eq.windSpeed}</div>
                  <div className="text-xs text-gray-400">风速 (m/s)</div>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <div className={`text-xl font-bold font-mono ${
                    eq.angle > 3 ? 'text-red-400' : eq.angle > 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{eq.angle}°</div>
                  <div className="text-xs text-gray-400">倾角</div>
                </div>
              </div>

              <ReactECharts option={loadOption(eq)} style={{ height: 100 }} />
              
              <div className="mt-2 pt-3 border-t border-border-glow text-xs text-gray-400 flex justify-between">
                <span>司机: {eq.operator}</span>
                <span>{eq.lastUpdate}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card 
        className="panel" 
        title={<span className="panel-title"><DashboardOutlined /> 实时数据趋势 - {selectedEquipment?.name || '1号塔吊'}</span>} 
        bordered={false}
      >
        <ReactECharts option={realtimeTrendOption} style={{ height: 300 }} />
      </Card>

      <Card className="panel" bordered={false}>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            placeholder="设备类型"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={typeFilter === 'all' ? undefined : typeFilter}
            onChange={(v) => setTypeFilter(v || 'all')}
          >
            {types.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
          <Select
            placeholder="运行状态"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={statusFilter === 'all' ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
          >
            <Option value="running">运行中</Option>
            <Option value="warning">预警</Option>
            <Option value="danger">危险</Option>
            <Option value="offline">离线</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEquipment}
          rowKey="id"
          scroll={{ x: 1300 }}
          size="middle"
          pagination={false}
        />
      </Card>

      <Modal
        title="设备详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={selectedEquipment?.status === 'danger' ? [
          <Button key="stop" type="primary" danger icon={<ThunderboltOutlined />} onClick={handleEmergencyStop}>
            紧急停机
          </Button>
        ] : null}
        width={800}
      >
        {selectedEquipment && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                selectedEquipment.type === 'tower-crane' ? 'bg-blue-500/20' :
                selectedEquipment.type === 'elevator' ? 'bg-green-500/20' : 'bg-purple-500/20'
              }`}>
                {selectedEquipment.type === 'tower-crane' ? <RiseOutlined className="text-blue-400 text-3xl" /> :
                 selectedEquipment.type === 'elevator' ? <ArrowUpOutlined className="text-green-400 text-3xl" /> :
                 <DashboardOutlined className="text-purple-400 text-3xl" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedEquipment.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusTag status={selectedEquipment.status} type="equipment" />
                  <span className="text-gray-400">{selectedEquipment.typeName} · {selectedEquipment.model}</span>
                </div>
              </div>
            </div>

            <Descriptions column={2} bordered size="small" className="text-sm">
              <Descriptions.Item label="设备编号">{selectedEquipment.id}</Descriptions.Item>
              <Descriptions.Item label="所在位置">{selectedEquipment.location}</Descriptions.Item>
              <Descriptions.Item label="当前载重">
                <span className={selectedEquipment.load / selectedEquipment.maxLoad > 0.9 ? 'text-red-400' : 
                                selectedEquipment.load / selectedEquipment.maxLoad > 0.7 ? 'text-yellow-400' : 'text-green-400'}>
                  {selectedEquipment.load} / {selectedEquipment.maxLoad} 吨
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前力矩">
                <span className={selectedEquipment.moment > selectedEquipment.maxMoment ? 'text-red-400' : 'text-white'}>
                  {selectedEquipment.moment} / {selectedEquipment.maxMoment} kN·m
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前高度">{selectedEquipment.height} m</Descriptions.Item>
              <Descriptions.Item label="当前倾角">{selectedEquipment.angle}°</Descriptions.Item>
              <Descriptions.Item label="当前风速">
                <span className={selectedEquipment.windSpeed > 6 ? 'text-red-400' : 
                                selectedEquipment.windSpeed > 4 ? 'text-yellow-400' : 'text-green-400'}>
                  {selectedEquipment.windSpeed} m/s
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="限位状态">
                <Tag color={selectedEquipment.limitStatus === '正常' ? 'green' : 
                           selectedEquipment.limitStatus.includes('预警') ? 'orange' : 'red'}>
                  {selectedEquipment.limitStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作人员">{selectedEquipment.operator}</Descriptions.Item>
              <Descriptions.Item label="数据更新">{selectedEquipment.lastUpdate}</Descriptions.Item>
            </Descriptions>

            {selectedEquipment.status === 'danger' && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse">
                <div className="flex items-center gap-2 text-red-400">
                  <ExclamationCircleOutlined className="text-xl" />
                  <span className="font-bold">设备处于危险状态！</span>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {selectedEquipment.limitStatus}，请立即处理。达到危险阈值已自动执行保护措施。
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-blue-400 font-medium mb-2">黑匣子数据</div>
              <div className="text-sm text-gray-400">
                所有运行数据实时加密存储，不可篡改，保留周期5年，支持事故追溯和监管检查。
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
