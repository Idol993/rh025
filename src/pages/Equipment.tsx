import { useState, useMemo, useEffect } from 'react'
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
  Space,
  Alert,
  message,
  Input,
  Radio,
  Form
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
  ArrowUpOutlined,
  UnlockOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'
import type { Equipment } from '@/types'
import { useSearchParams } from 'react-router-dom'

const { Option } = Select

export default function Equipment() {
  const { equipment, emergencyStopEquipment, unlockEquipment, currentUser } = useAppStore()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) setStatusFilter(filter)
  }, [])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [stopping, setStopping] = useState(false)
  const [unlockModalVisible, setUnlockModalVisible] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockForm] = Form.useForm()

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
    running: equipment.filter(e => e.status === 'running' && !e.isLocked).length,
    warning: equipment.filter(e => e.status === 'warning').length,
    danger: equipment.filter(e => e.status === 'danger' || e.isLocked).length,
    offline: equipment.filter(e => e.status === 'offline' && !e.isLocked).length,
    locked: equipment.filter(e => e.isLocked).length
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

  const handleEmergencyStop = (equipment?: Equipment) => {
    const eq = equipment || selectedEquipment
    if (!eq) {
      const dangerEqs = filteredEquipment.filter(e => e.status === 'danger' && !e.isLocked)
      if (dangerEqs.length === 0) {
        Modal.info({
          title: '无危险设备',
          content: '当前所有设备运行正常，若需对特定设备执行保护请进入设备详情操作。'
        })
        return
      }
      if (dangerEqs.length === 1) {
        handleEmergencyStop(dangerEqs[0])
        return
      }
      Modal.confirm({
        title: '选择需紧急停机的设备',
        content: (
          <div className="space-y-2 text-sm text-gray-300">
            检测到 {dangerEqs.length} 台设备处于危险状态：
            <ul className="space-y-1 mt-2">
              {dangerEqs.map(d => (
                <li key={d.id} className="flex justify-between items-center p-2 rounded bg-red-500/10">
                  <span>{d.name} - {d.location}</span>
                  <StatusTag status={d.status} type="equipment" />
                </li>
              ))}
            </ul>
            <div className="text-xs text-yellow-300 mt-2">
              将对上述所有设备统一执行紧急停机保护。
            </div>
          </div>
        ),
        okText: '全部停机',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          let count = 0
          dangerEqs.forEach((d, idx) => {
            setTimeout(() => {
              emergencyStopEquipment(d.id, `批量紧急停机：危险状态处置，操作人：${currentUser.name}`)
              count++
              if (count === dangerEqs.length) {
                message.success(`已对 ${dangerEqs.length} 台危险设备执行紧急停机保护`)
              }
            }, idx * 250)
          })
        }
      })
      return
    }
    if (eq.isLocked) {
      Modal.info({
        title: '设备已锁定',
        content: `「${eq.name}」已于 ${eq.lockTime} 执行紧急停机保护，当前处于断电/锁机状态，需技术人员排查后解锁。`
      })
      return
    }
    Modal.confirm({
      title: '⚠️ 确认执行紧急停机保护',
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300">
            <ExclamationCircleOutlined />
            <span>本操作将立即切断设备电源/锁机，强制执行安全保护！</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">设备：</span>
              <span className="text-white font-medium">{eq.name}（{eq.typeName}）</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">位置：</span>
              <span>{eq.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">当前状态：</span>
              <StatusTag status={eq.status} type="equipment" />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">操作员：</span>
              <span>{eq.operator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">执行原因：</span>
              <span className="text-red-300">
                {eq.status === 'danger' ? '设备已达危险阈值，自动保护触发' : '手动执行紧急停机'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            <CheckCircleOutlined className="text-green-400 mr-1" />
            保护动作：断电 / 锁机 / 断油；黑匣子数据自动保存且不可篡改
          </div>
        </div>
      ),
      okText: '确认停机',
      okType: 'danger',
      okButtonProps: { loading: stopping },
      cancelText: '取消',
      onOk: async () => {
        setStopping(true)
        const reason = (eq.status === 'danger' ? '危险阈值超限，自动触发紧急停机保护' : '管理员手动触发紧急停机') + `，操作人：${currentUser.name}`
        emergencyStopEquipment(eq.id, reason)
        setTimeout(() => {
          setStopping(false)
          setModalVisible(false)
          Modal.success({
            title: '紧急停机保护已执行',
            content: (
              <div className="space-y-2">
                <div>「{eq.name}」已成功执行断电/锁机保护</div>
                <div className="text-xs text-gray-400">
                  黑匣子数据已封存，事故追溯功能可用。设备状态、详情页、统计卡片已同步更新。
                </div>
              </div>
            )
          })
        }, 600)
      }
    })
  }

  const handleUnlock = (eq: Equipment) => {
    setSelectedEquipment(eq)
    unlockForm.resetFields()
    unlockForm.setFieldsValue({ targetStatus: 'running', operator: currentUser.name })
    setUnlockModalVisible(true)
  }

  const handleUnlockSubmit = async () => {
    try {
      const values = await unlockForm.validateFields()
      setUnlocking(true)
      unlockEquipment(
        selectedEquipment!.id,
        values.inspectionResult,
        values.resetNote,
        values.operator,
        values.targetStatus
      )
      setTimeout(() => {
        setUnlocking(false)
        setUnlockModalVisible(false)
        setModalVisible(false)
        message.success(`「${selectedEquipment?.name}」已解锁复位，恢复为${values.targetStatus === 'running' ? '正常运行' : '预警'}状态`)
      }, 600)
    } catch {
      // form validation failed
    }
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
          <Button danger size="small" icon={<ThunderboltOutlined />} onClick={() => handleEmergencyStop()}>
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
                eq.isLocked ? 'border-gray-500/60 opacity-80' :
                eq.status === 'danger' ? 'border-red-500/50 animate-pulse' :
                eq.status === 'warning' ? 'border-yellow-500/50' : 'border-border-glow'
              }`}
              bordered={false}
              size="small"
              actions={[
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(eq)}>
                  查看详情
                </Button>,
                eq.isLocked ? (
                  <Button type="link" size="small" icon={<UnlockOutlined />} style={{ color: '#52c41a' }} onClick={() => handleUnlock(eq)}>
                    解锁复位
                  </Button>
                ) : (eq.status === 'danger' || eq.status === 'warning') ? (
                  <Button type="link" size="small" danger icon={<ThunderboltOutlined />} onClick={() => handleEmergencyStop(eq)}>
                    紧急停机
                  </Button>
                ) : (
                  <span className="text-gray-500 text-xs py-1">运行正常</span>
                )
              ]}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    eq.isLocked ? 'bg-gray-500/30' :
                    eq.type === 'tower-crane' ? 'bg-blue-500/20' :
                    eq.type === 'elevator' ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    {eq.isLocked ? <ThunderboltOutlined className="text-gray-400 text-xl" /> :
                     eq.type === 'tower-crane' ? <RiseOutlined className="text-blue-400 text-xl" /> :
                     eq.type === 'elevator' ? <ArrowUpOutlined className="text-green-400 text-xl" /> :
                     <DashboardOutlined className="text-purple-400 text-xl" />}
                  </div>
                  <div>
                    <div className="text-white font-bold">{eq.name}</div>
                    <div className="text-xs text-gray-400">{eq.typeName} · {eq.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <StatusTag status={eq.status} type="equipment" />
                  {eq.isLocked && (
                    <div className="mt-1 text-xs text-red-400 font-mono">已锁机</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded bg-white/5">
                  <div className="text-xl font-bold text-cyan-300 font-mono">{eq.isLocked ? '--' : eq.height}</div>
                  <div className="text-xs text-gray-400">高度 (m)</div>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <div className={`text-xl font-bold font-mono ${
                    eq.isLocked ? 'text-gray-500' :
                    eq.windSpeed > 6 ? 'text-red-400' : eq.windSpeed > 4 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{eq.isLocked ? '--' : eq.windSpeed}</div>
                  <div className="text-xs text-gray-400">风速 (m/s)</div>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <div className={`text-xl font-bold font-mono ${
                    eq.isLocked ? 'text-gray-500' :
                    eq.angle > 3 ? 'text-red-400' : eq.angle > 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{eq.isLocked ? '--' : eq.angle}°</div>
                  <div className="text-xs text-gray-400">倾角</div>
                </div>
              </div>

              {!eq.isLocked && <ReactECharts option={loadOption(eq)} style={{ height: 100 }} />}
              {eq.isLocked && (
                <div className="h-[100px] flex items-center justify-center rounded bg-gray-500/10 border border-gray-500/30 text-gray-400 text-sm">
                  <ThunderboltOutlined className="mr-2 text-red-400" />
                  设备已锁定，数据采集暂停
                </div>
              )}
              
              <div className="mt-2 pt-3 border-t border-border-glow text-xs text-gray-400 flex justify-between">
                <span>司机: {eq.operator}</span>
                <span>{eq.isLocked ? `锁机时间: ${eq.lockTime}` : eq.lastUpdate}</span>
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
        footer={selectedEquipment ? (
          selectedEquipment.isLocked ? [
            <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>,
            <Button key="unlock" type="primary" icon={<UnlockOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => { setModalVisible(false); handleUnlock(selectedEquipment); }}>
              解锁复位
            </Button>
          ] : (selectedEquipment.status === 'danger' || selectedEquipment.status === 'warning') ? [
            <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>,
            <Button key="stop" type="primary" danger icon={<ThunderboltOutlined />} onClick={() => handleEmergencyStop(selectedEquipment)}>
              紧急停机
            </Button>
          ] : [
            <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>
          ]
        ) : null}
        width={800}
      >
        {selectedEquipment && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                selectedEquipment.isLocked ? 'bg-gray-500/30' :
                selectedEquipment.type === 'tower-crane' ? 'bg-blue-500/20' :
                selectedEquipment.type === 'elevator' ? 'bg-green-500/20' : 'bg-purple-500/20'
              }`}>
                {selectedEquipment.isLocked ? <ThunderboltOutlined className="text-gray-400 text-3xl" /> :
                 selectedEquipment.type === 'tower-crane' ? <RiseOutlined className="text-blue-400 text-3xl" /> :
                 selectedEquipment.type === 'elevator' ? <ArrowUpOutlined className="text-green-400 text-3xl" /> :
                 <DashboardOutlined className="text-purple-400 text-3xl" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedEquipment.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusTag status={selectedEquipment.status} type="equipment" />
                  {selectedEquipment.isLocked && (
                    <Tag color="red" icon={<ThunderboltOutlined />}>已断电锁机</Tag>
                  )}
                  <span className="text-gray-400">{selectedEquipment.typeName} · {selectedEquipment.model}</span>
                </div>
              </div>
            </div>

            {selectedEquipment.isLocked && (
              <Alert
                type="error"
                showIcon
                icon={<ThunderboltOutlined />}
                message="设备已执行紧急停机保护"
                description={
                  <div className="space-y-1">
                    <div><span className="text-gray-400">锁机时间：</span>{selectedEquipment.lockTime}</div>
                    <div><span className="text-gray-400">锁机原因：</span>{selectedEquipment.lockReason}</div>
                    <div className="text-xs text-yellow-300 mt-1">
                      当前设备已断电/锁机/断油，需由持证技术人员排查隐患并确认安全后方可解锁复位。
                    </div>
                  </div>
                }
              />
            )}

            {selectedEquipment.unlockTime && (
              <Alert
                type="success"
                showIcon
                icon={<UnlockOutlined />}
                message="历史解锁复位记录"
                description={
                  <div className="space-y-1">
                    <div><span className="text-gray-400">解锁时间：</span>{selectedEquipment.unlockTime}</div>
                    <div><span className="text-gray-400">排查结果：</span>{selectedEquipment.unlockInspectionResult}</div>
                    <div><span className="text-gray-400">复位说明：</span>{selectedEquipment.unlockResetNote}</div>
                    <div><span className="text-gray-400">操作人员：</span>{selectedEquipment.unlockOperator}</div>
                  </div>
                }
              />
            )}

            <Descriptions column={2} bordered size="small" className="text-sm">
              <Descriptions.Item label="设备编号">{selectedEquipment.id}</Descriptions.Item>
              <Descriptions.Item label="所在位置">{selectedEquipment.location}</Descriptions.Item>
              <Descriptions.Item label="当前载重">
                <span className={!selectedEquipment.isLocked && selectedEquipment.load / selectedEquipment.maxLoad > 0.9 ? 'text-red-400' : 
                                !selectedEquipment.isLocked && selectedEquipment.load / selectedEquipment.maxLoad > 0.7 ? 'text-yellow-400' : 'text-green-400'}>
                  {selectedEquipment.isLocked ? '--' : `${selectedEquipment.load} / ${selectedEquipment.maxLoad} 吨`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前力矩">
                <span className={!selectedEquipment.isLocked && selectedEquipment.moment > selectedEquipment.maxMoment ? 'text-red-400' : 'text-white'}>
                  {selectedEquipment.isLocked ? '--' : `${selectedEquipment.moment} / ${selectedEquipment.maxMoment} kN·m`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前高度">{selectedEquipment.isLocked ? '--' : `${selectedEquipment.height} m`}</Descriptions.Item>
              <Descriptions.Item label="当前倾角">{selectedEquipment.isLocked ? '--' : `${selectedEquipment.angle}°`}</Descriptions.Item>
              <Descriptions.Item label="当前风速">
                <span className={!selectedEquipment.isLocked && selectedEquipment.windSpeed > 6 ? 'text-red-400' : 
                                !selectedEquipment.isLocked && selectedEquipment.windSpeed > 4 ? 'text-yellow-400' : 'text-green-400'}>
                  {selectedEquipment.isLocked ? '--' : `${selectedEquipment.windSpeed} m/s`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="限位状态">
                <Tag color={selectedEquipment.limitStatus === '正常' ? 'green' : 
                           selectedEquipment.limitStatus.includes('预警') ? 'orange' : 'red'}>
                  {selectedEquipment.isLocked ? '已保护锁定' : selectedEquipment.limitStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作人员">{selectedEquipment.operator}</Descriptions.Item>
              <Descriptions.Item label="数据更新">{selectedEquipment.isLocked ? `锁定于 ${selectedEquipment.lockTime}` : selectedEquipment.lastUpdate}</Descriptions.Item>
            </Descriptions>

            {!selectedEquipment.isLocked && selectedEquipment.status === 'danger' && (
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
                {selectedEquipment.isLocked && (
                  <span className="text-red-300"> 本次紧急停机事件数据已封存，不可删除修改。</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<span className="flex items-center gap-2"><UnlockOutlined style={{ color: '#52c41a' }} /> 设备解锁复位</span>}
        open={unlockModalVisible}
        onCancel={() => setUnlockModalVisible(false)}
        onOk={handleUnlockSubmit}
        okText="确认解锁复位"
        okButtonProps={{ loading: unlocking, style: { background: '#52c41a', borderColor: '#52c41a' } }}
        cancelText="取消"
        width={600}
      >
        {selectedEquipment && (
          <div className="space-y-4">
            <Alert
              type="warning"
              showIcon
              message="解锁前请确认以下事项"
              description={
                <ul className="space-y-1 text-sm text-gray-300 mt-2">
                  <li>1. 已由持证技术人员完成设备全面排查</li>
                  <li>2. 隐患已排除，设备各项指标恢复正常</li>
                  <li>3. 安全保护装置已复位并确认有效</li>
                  <li>4. 现场已确认无人员处于危险区域</li>
                </ul>
              }
            />
            <div className="p-3 rounded bg-gray-500/10 border border-gray-500/30 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">设备：</span>
                <span className="text-white">{selectedEquipment.name}（{selectedEquipment.typeName}）</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">锁机时间：</span>
                <span>{selectedEquipment.lockTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">锁机原因：</span>
                <span className="text-red-300">{selectedEquipment.lockReason}</span>
              </div>
            </div>
            <Form form={unlockForm} layout="vertical">
              <Form.Item
                label="排查结果"
                name="inspectionResult"
                rules={[{ required: true, message: '请填写排查结果' }]}
              >
                <Input.TextArea rows={3} placeholder="请描述排查发现的问题及处理措施，例如：经排查，载重传感器异常已修复，校准后读数正常" />
              </Form.Item>
              <Form.Item
                label="复位说明"
                name="resetNote"
                rules={[{ required: true, message: '请填写复位说明' }]}
              >
                <Input.TextArea rows={2} placeholder="请描述复位操作及安全确认，例如：安全保护装置已复位，现场确认无人员危险区域" />
              </Form.Item>
              <Form.Item
                label="复位后状态"
                name="targetStatus"
                rules={[{ required: true, message: '请选择复位后状态' }]}
              >
                <Radio.Group>
                  <Radio value="running">正常运行</Radio>
                  <Radio value="warning">预警监控</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="操作人员"
                name="operator"
                rules={[{ required: true, message: '请填写操作人员' }]}
              >
                <Input placeholder="持证技术人员姓名" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
