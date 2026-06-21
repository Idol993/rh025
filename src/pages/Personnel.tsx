import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Row,
  Col,
  Tag,
  Avatar,
  Descriptions,
  Tabs,
  Statistic,
  Progress,
  List,
  Space,
  Switch,
  InputNumber,
  message
} from 'antd'
import {
  TeamOutlined,
  UserAddOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import StatusTag from '@/components/StatusTag'
import StatCard from '@/components/StatCard'
import { useAppStore } from '@/store/useStore'
import type { Worker } from '@/types'
import { useSearchParams } from 'react-router-dom'

const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

export default function Personnel() {
  const { workers, addWorker, updateWorker } = useAppStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) setStatusFilter(filter)

    const detailId = searchParams.get('detailId')
    if (detailId) {
      const worker = workers.find(w => w.id === detailId)
      if (worker) {
        setSelectedWorker(worker)
        setActionType('view')
        setModalVisible(true)
      }
    }
  }, [searchParams, workers])
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [actionType, setActionType] = useState<'view' | 'add' | 'edit'>('view')
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const workTypes = useMemo(() => [...new Set(workers.map(w => w.workType))], [workers])
  const teams = useMemo(() => [...new Set(workers.map(w => w.team))], [workers])

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchSearch = !searchText || 
        w.name.includes(searchText) || 
        w.idCard.includes(searchText) ||
        w.phone.includes(searchText) ||
        w.id.includes(searchText)
      const matchStatus = statusFilter === 'all' || w.status === statusFilter
      const matchWorkType = workTypeFilter === 'all' || w.workType === workTypeFilter
      const matchTeam = teamFilter === 'all' || w.team === teamFilter
      return matchSearch && matchStatus && matchWorkType && matchTeam
    })
  }, [workers, searchText, statusFilter, workTypeFilter, teamFilter])

  const stats = useMemo(() => ({
    total: workers.length,
    onSite: workers.filter(w => w.status === 'on-site').length,
    offSite: workers.filter(w => w.status === 'off-site').length,
    blacklist: workers.filter(w => w.status === 'blacklist').length,
    pending: workers.filter(w => w.status === 'pending').length,
    needTraining: workers.filter(w => !w.trainingPassed).length,
    invalidCert: workers.filter(w => !w.certificate.valid).length,
    expiringCert: workers.filter(w => dayjs(w.certificate.expiryDate).diff(dayjs(), 'month') < 3).length,
  }), [workers])

  const workTypeChartOption = {
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#8fa3b8' }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: 'rgba(10, 22, 40, 0.8)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' }
      },
      data: workTypes.map((name, i) => ({
        name,
        value: workers.filter(w => w.workType === name).length
      }))
    }],
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911', '#eb2f96', '#13c2c2']
  }

  const teamChartOption = {
    tooltip: { trigger: 'axis' },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: teams,
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    series: [{
      type: 'bar',
      data: teams.map(name => workers.filter(w => w.team === name).length),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#096dd9' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  }

  const entryTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [{
      type: 'line',
      smooth: true,
      data: [45, 68, 92, 125, 156, 120],
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
      lineStyle: { color: '#1890ff', width: 3 },
      itemStyle: { color: '#1890ff' }
    }]
  }

  const handleView = (worker: Worker) => {
    setSelectedWorker(worker)
    setActionType('view')
    setModalVisible(true)
  }

  const handleAdd = () => {
    setSelectedWorker(null)
    setActionType('add')
    form.resetFields()
    form.setFieldsValue({
      trainingHours: 0,
      trainingPassed: false,
      'certificate.type': '上岗证',
      'certificate.number': '',
      'certificate.expiryDate': dayjs().add(1, 'year').format('YYYY-MM-DD'),
      'certificate.valid': true
    })
    setModalVisible(true)
  }

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker)
    setActionType('edit')
    form.setFieldsValue({
      ...worker,
      'certificate.type': worker.certificate.type,
      'certificate.number': worker.certificate.number,
      'certificate.expiryDate': worker.certificate.expiryDate,
      'certificate.valid': worker.certificate.valid
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const values = await form.validateFields()
      const certData = {
        type: values['certificate.type'],
        number: values['certificate.number'],
        expiryDate: values['certificate.expiryDate'],
        valid: values['certificate.valid']
      }
      const workerData = {
        name: values.name,
        idCard: values.idCard,
        phone: values.phone,
        emergencyContact: values.emergencyContact,
        workType: values.workType,
        team: values.team,
        subcontractor: values.subcontractor,
        trainingHours: values.trainingHours ?? 0,
        trainingPassed: values.trainingPassed ?? false,
        certificate: certData
      }

      if (actionType === 'add') {
        addWorker(workerData)
        message.success('工人添加成功！' + ((!workerData.trainingPassed || workerData.trainingHours < 24 || !certData.valid) ? '未满足入场条件，已进入待审核状态。' : '已自动审核通过。'))
      } else if (actionType === 'edit' && selectedWorker) {
        updateWorker(selectedWorker.id, workerData)
        message.success('工人信息更新成功！')
      }
      setModalVisible(false)
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('操作失败：' + (e?.message || '数据校验失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '工人信息',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
      render: (text: string, record: Worker) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<IdcardOutlined />} />
          <div>
            <div className="text-white font-medium">{text}</div>
            <div className="text-xs text-gray-400">{record.id}</div>
          </div>
        </div>
      )
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 200,
      render: (text: string) => (
        <span className="font-mono text-sm">
          {text.substring(0, 6)}****{text.substring(text.length - 4)}
        </span>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-sm">
          {text.substring(0, 3)}****{text.substring(text.length - 4)}
        </span>
      )
    },
    {
      title: '工种',
      dataIndex: 'workType',
      key: 'workType',
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '所属班组',
      dataIndex: 'team',
      key: 'team',
      width: 120
    },
    {
      title: '分包单位',
      dataIndex: 'subcontractor',
      key: 'subcontractor',
      width: 120
    },
    {
      title: '培训状态',
      key: 'training',
      width: 140,
      render: (_: any, record: Worker) => (
        <div>
          {record.trainingPassed ? (
            <div className="flex items-center gap-1">
              <CheckCircleOutlined className="text-green-400" />
              <span className="text-green-400 text-sm">已完成</span>
              <span className="text-gray-400 text-xs">({record.trainingHours}学时)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <WarningOutlined className="text-yellow-400" />
              <span className="text-yellow-400 text-sm">未完成</span>
              <span className="text-gray-400 text-xs">({record.trainingHours}/24学时)</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '证件状态',
      key: 'certificate',
      width: 180,
      render: (_: any, record: Worker) => {
        const cert = record.certificate
        const isExpiring = dayjs(cert.expiryDate).diff(dayjs(), 'month') < 3
        return (
          <div className="text-xs">
            <div className="text-gray-300">{cert.type}</div>
            <div className="text-gray-400">{cert.number}</div>
            <div className={`flex items-center gap-1 mt-1 ${
              !cert.valid ? 'text-red-400' : isExpiring ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {!cert.valid ? (
                <><ExclamationCircleOutlined /> 无效</>
              ) : isExpiring ? (
                <><ClockCircleOutlined /> 即将过期 ({cert.expiryDate})</>
              ) : (
                <><CheckCircleOutlined /> 有效 (至{cert.expiryDate})</>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: '入场状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} type="worker" />
    },
    {
      title: '进场时间',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 120
    },
    {
      title: '最后打卡',
      dataIndex: 'lastCheckIn',
      key: 'lastCheckIn',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Worker) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      )
    }
  ]

  const workerDetailTabs = selectedWorker && (
    <Tabs defaultActiveKey="basic">
      <TabPane tab="基本信息" key="basic">
        <Descriptions column={2} bordered size="small" className="text-sm">
          <Descriptions.Item label="姓名">{selectedWorker.name}</Descriptions.Item>
          <Descriptions.Item label="工号">{selectedWorker.id}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{selectedWorker.idCard}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{selectedWorker.phone}</Descriptions.Item>
          <Descriptions.Item label="紧急联系人">{selectedWorker.emergencyContact}</Descriptions.Item>
          <Descriptions.Item label="工种">{selectedWorker.workType}</Descriptions.Item>
          <Descriptions.Item label="所属班组">{selectedWorker.team}</Descriptions.Item>
          <Descriptions.Item label="分包单位">{selectedWorker.subcontractor}</Descriptions.Item>
          <Descriptions.Item label="进场时间">{selectedWorker.entryTime}</Descriptions.Item>
          <Descriptions.Item label="在场状态">
            <StatusTag status={selectedWorker.status} type="worker" />
          </Descriptions.Item>
        </Descriptions>
      </TabPane>
      <TabPane tab="三级安全教育" key="training">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">培训状态</span>
            <StatusTag status={selectedWorker.trainingPassed ? 'success' : 'warning'} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">培训学时</span>
              <span className="text-cyan-300 font-mono">{selectedWorker.trainingHours}/24 学时</span>
            </div>
            <Progress 
              percent={Math.min(selectedWorker.trainingHours / 24 * 100, 100)} 
              strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
            />
          </div>
          <List
            size="small"
            header={<div className="text-gray-400 text-sm">培训记录</div>}
            dataSource={[
              { name: '一级安全教育（公司）', time: '2025-01-15', hours: 8, passed: true },
              { name: '二级安全教育（项目）', time: '2025-01-16', hours: 8, passed: true },
              { name: '三级安全教育（班组）', time: '2025-01-17', hours: 8, passed: selectedWorker.trainingHours >= 24 }
            ]}
            renderItem={(item) => (
              <List.Item className="!border-b !border-dashed !border-border-glow">
                <div className="flex-1">
                  <div className="text-white text-sm">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.time} · {item.hours}学时</div>
                </div>
                <StatusTag status={item.passed ? 'success' : 'warning'} />
              </List.Item>
            )}
          />
        </div>
      </TabPane>
      <TabPane tab="证件信息" key="cert">
        <Card size="small" className="bg-white/5 border-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">证件类型</span>
              <span className="text-white">{selectedWorker.certificate.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">证件编号</span>
              <span className="text-white font-mono">{selectedWorker.certificate.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">有效期至</span>
              <span className={`font-mono ${
                dayjs(selectedWorker.certificate.expiryDate).diff(dayjs(), 'month') < 3 
                  ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {selectedWorker.certificate.expiryDate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">证件有效性</span>
              <StatusTag status={selectedWorker.certificate.valid ? 'success' : 'danger'} />
            </div>
          </div>
        </Card>
      </TabPane>
      <TabPane tab="考勤记录" key="attendance">
        <List
          size="small"
          dataSource={Array.from({ length: 5 }, (_, i) => ({
            date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
            checkIn: `0${6 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            checkOut: `1${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            status: Math.random() > 0.1 ? 'normal' : 'late'
          }))}
          renderItem={(item) => (
            <List.Item className="!border-b !border-dashed !border-border-glow">
              <span className="text-white">{item.date}</span>
              <span className="text-cyan-300 font-mono">上班: {item.checkIn}</span>
              <span className="text-cyan-300 font-mono">下班: {item.checkOut}</span>
              <StatusTag status={item.status === 'normal' ? 'success' : 'warning'} />
            </List.Item>
          )}
        />
      </TabPane>
    </Tabs>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-cyan-300 glow-text flex items-center gap-2">
          <TeamOutlined /> 人员实名制管理
        </h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>
          添加工人
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="总人数" value={stats.total} unit="人" icon={<TeamOutlined />} color="cyan" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="在场" value={stats.onSite} unit="人" icon={<SafetyOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="离场" value={stats.offSite} unit="人" icon={<UserAddOutlined />} color="blue" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="待培训" value={stats.needTraining} unit="人" icon={<WarningOutlined />} color="yellow" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="证件过期" value={stats.invalidCert} unit="人" icon={<ExclamationCircleOutlined />} color="red" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="黑名单" value={stats.blacklist} unit="人" icon={<DeleteOutlined />} color="red" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="panel" title={<span className="panel-title"><TeamOutlined /> 工种分布</span>} bordered={false}>
            <ReactECharts option={workTypeChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="panel" title={<span className="panel-title"><TeamOutlined /> 各班组人数</span>} bordered={false}>
            <ReactECharts option={teamChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="panel" title={<span className="panel-title"><ClockCircleOutlined /> 人员入场趋势</span>} bordered={false}>
            <ReactECharts option={entryTrendOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card className="panel" bordered={false}>
        <div className="flex flex-wrap gap-4 mb-4">
          <Search
            placeholder="搜索姓名、身份证、手机号、工号"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 320 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={statusFilter === 'all' ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
          >
            <Option value="all">全部状态</Option>
            <Option value="on-site">在场</Option>
            <Option value="off-site">离场</Option>
            <Option value="blacklist">黑名单</Option>
            <Option value="pending">待审核</Option>
          </Select>
          <Select
            placeholder="工种筛选"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={workTypeFilter === 'all' ? undefined : workTypeFilter}
            onChange={(v) => setWorkTypeFilter(v || 'all')}
          >
            {workTypes.map(wt => <Option key={wt} value={wt}>{wt}</Option>)}
          </Select>
          <Select
            placeholder="班组筛选"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={teamFilter === 'all' ? undefined : teamFilter}
            onChange={(v) => setTeamFilter(v || 'all')}
          >
            {teams.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </div>

        <div className="mb-2 text-sm text-gray-400">
          共 {filteredWorkers.length} 条记录
        </div>

        <Table
          columns={columns}
          dataSource={filteredWorkers}
          rowKey="id"
          scroll={{ x: 1600 }}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          className="bg-transparent"
        />
      </Card>

      <Modal
        title={actionType === 'view' ? '工人详情' : actionType === 'add' ? '添加工人' : '编辑工人'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={actionType === 'view' ? null : [
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>确定</Button>
        ]}
        width={900}
        destroyOnClose
      >
        {actionType === 'view' ? (
          workerDetailTabs
        ) : (
          <Form form={form} layout="vertical" preserve={false}>
            <Card size="small" title="基本信息" className="bg-white/5 border-border-glow mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }, { len: 18, message: '身份证号应为18位' }]}>
                    <Input placeholder="请输入身份证号" maxLength={18} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { len: 11, message: '手机号应为11位' }]}>
                    <Input placeholder="请输入手机号" maxLength={11} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="emergencyContact" label="紧急联系人电话" rules={[{ len: 11, message: '手机号应为11位' }]}>
                    <Input placeholder="请输入紧急联系人电话" maxLength={11} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="workType" label="工种" rules={[{ required: true, message: '请选择工种' }]}>
                    <Select placeholder="请选择工种">
                      {workTypes.map(wt => <Option key={wt} value={wt}>{wt}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="team" label="班组" rules={[{ required: true, message: '请选择班组' }]}>
                    <Select placeholder="请选择班组">
                      {teams.map(t => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subcontractor" label="分包单位" rules={[{ required: true, message: '请输入分包单位' }]}>
                    <Input placeholder="请输入分包单位" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="三级安全教育" className="bg-white/5 border-border-glow mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="trainingHours" label="培训学时" rules={[{ required: true, message: '请输入培训学时' }]}>
                    <InputNumber min={0} max={999} className="w-full" placeholder="三级安全教育需≥24学时" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="trainingPassed" label="培训考核通过" valuePropName="checked">
                    <Switch checkedChildren="通过" unCheckedChildren="未通过" />
                  </Form.Item>
                </Col>
              </Row>
              {actionType === 'add' && (
                <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300">
                  <WarningOutlined className="mr-1" />
                  提示：培训学时不足24学时或考核未通过的人员将自动进入"待审核"状态，禁止入场作业。
                </div>
              )}
            </Card>

            <Card size="small" title="上岗证信息" className="bg-white/5 border-border-glow">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="certificate.type" label="证件类型" rules={[{ required: true }]}>
                    <Select placeholder="请选择证件类型">
                      <Option value="上岗证">上岗证</Option>
                      <Option value="特种作业操作证">特种作业操作证</Option>
                      <Option value="职业资格证">职业资格证</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="certificate.number" label="证件编号" rules={[{ required: true, message: '请输入证件编号' }]}>
                    <Input placeholder="请输入证件编号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="certificate.expiryDate" label="有效期至" rules={[{ required: true, message: '请输入有效期' }]}>
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="certificate.valid" label="证件是否有效" valuePropName="checked">
                    <Switch checkedChildren="有效" unCheckedChildren="无效" />
                  </Form.Item>
                </Col>
              </Row>
              {actionType === 'add' && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300 mt-2">
                  <ExclamationCircleOutlined className="mr-1" />
                  强约束规则：证件无效或过期人员一律禁止入场，系统将自动设为待审核。
                </div>
              )}
            </Card>
          </Form>
        )}
      </Modal>
    </div>
  )
}
