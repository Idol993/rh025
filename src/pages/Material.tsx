import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Modal,
  Row,
  Col,
  Image,
  Tag,
  Descriptions,
  Space,
  Alert,
  Input,
  Form,
  message
} from 'antd'
import {
  StockOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CarOutlined,
  RiseOutlined,
  CameraOutlined,
  TruckOutlined,
  UserOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'
import type { Material } from '@/types'
import { useSearchParams } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

export default function Material() {
  const { materials, updateMaterialAcceptance, currentUser } = useAppStore()
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) setResultFilter(filter)

    const detailId = searchParams.get('detailId')
    if (detailId) {
      const material = materials.find(m => m.id === detailId)
      if (material) {
        setSelectedMaterial(material)
        setModalVisible(true)
      }
    }
  }, [searchParams, materials])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [remarkModalVisible, setRemarkModalVisible] = useState(false)
  const [remarkForm] = Form.useForm()
  const [pendingAcceptType, setPendingAcceptType] = useState<'passed' | 'rejected' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const suppliers = useMemo(() => [...new Set(materials.map(m => m.supplier))], [materials])
  const materialNames = useMemo(() => [...new Set(materials.map(m => m.name))], [materials])

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSupplier = supplierFilter === 'all' || m.supplier === supplierFilter
      const matchResult = resultFilter === 'all' || m.acceptanceResult === resultFilter
      return matchSupplier && matchResult
    })
  }, [materials, supplierFilter, resultFilter])

  const stats = useMemo(() => ({
    total: materials.length,
    today: materials.filter(m => dayjs(m.entryTime).isSame(dayjs(), 'day')).length,
    passed: materials.filter(m => m.acceptanceResult === 'passed').length,
    rejected: materials.filter(m => m.acceptanceResult === 'rejected').length,
    pending: materials.filter(m => m.acceptanceResult === 'pending').length,
    totalWeight: materials.reduce((sum, m) => sum + m.actualWeight, 0)
  }), [materials])

  const supplierStats = useMemo(() => {
    const map: Record<string, { passed: number; rejected: number; total: number }> = {}
    materials.forEach(m => {
      if (!map[m.supplier]) {
        map[m.supplier] = { passed: 0, rejected: 0, total: 0 }
      }
      map[m.supplier].total++
      if (m.acceptanceResult === 'passed') map[m.supplier].passed++
      if (m.acceptanceResult === 'rejected') map[m.supplier].rejected++
    })
    return Object.entries(map).map(([name, data]) => ({
      name,
      验收通过: data.passed,
      验收拒绝: data.rejected,
      total: data.total
    }))
  }, [materials])

  const monthTrendOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['进场量', '验收通过率'],
      textStyle: { color: '#8fa3b8' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: [
      {
        type: 'value',
        name: '重量(吨)',
        axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
        axisLabel: { color: '#8fa3b8' },
        splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
      },
      {
        type: 'value',
        name: '通过率(%)',
        min: 80,
        max: 100,
        axisLine: { lineStyle: { color: 'rgba(82, 196, 26, 0.3)' } },
        axisLabel: { color: '#8fa3b8', formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '进场量',
        type: 'bar',
        data: [520, 680, 750, 820, 690, 580],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#096dd9' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '验收通过率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: [96.5, 95.2, 97.8, 94.5, 98.2, 96.8],
        lineStyle: { color: '#52c41a', width: 3 },
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const materialTypeOption = {
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
      data: materialNames.map(name => ({
        name,
        value: materials.filter(m => m.name === name).reduce((sum, m) => sum + m.actualWeight, 0)
      }))
    }],
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']
  }

  const weightDiffOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: materials.slice(0, 20).map(m => m.id),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '偏差(%)',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [{
      type: 'bar',
      data: materials.slice(0, 20).map(m => m.weightDiffPercent),
      itemStyle: {
        color: (params: any) => Math.abs(params.value) > 3 ? '#f5222d' : '#52c41a'
      }
    }]
  }

  const handleView = (material: Material) => {
    setSelectedMaterial(material)
    setModalVisible(true)
  }

  const openRemarkDialog = (type: 'passed' | 'rejected') => {
    setPendingAcceptType(type)
    remarkForm.resetFields()
    remarkForm.setFieldsValue({ operator: currentUser.name })
    setRemarkModalVisible(true)
  }

  const handleAcceptance = async () => {
    if (!selectedMaterial || !pendingAcceptType) return
    try {
      setSubmitting(true)
      const values = await remarkForm.validateFields()
      const isOverDiff = Math.abs(selectedMaterial.weightDiffPercent) > 3
      const remark = values.remark || (pendingAcceptType === 'rejected' ? '验收不合格，材料不符合要求。' :
        isOverDiff ? `经材料员确认，超差${Math.abs(selectedMaterial.weightDiffPercent).toFixed(2)}%在合理范围内，同意接收。` : '验收合格。')
      const operator = values.operator || currentUser.name

      updateMaterialAcceptance(selectedMaterial.id, pendingAcceptType, operator, remark)
      setRemarkModalVisible(false)
      setModalVisible(false)
      message.success(
        pendingAcceptType === 'passed'
          ? (isOverDiff ? `验收通过！已记录材料员「${operator}」超差确认信息。` : '验收通过！')
          : '验收已拒绝。'
      )
    } catch (e: any) {
      if (e?.errorFields) return
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '材料信息',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Material) => (
        <div>
          <div className="text-white font-medium">{text}</div>
          <div className="text-xs text-gray-400">{record.spec}</div>
        </div>
      )
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 130
    },
    {
      title: '车辆信息',
      key: 'vehicle',
      width: 160,
      render: (_: any, record: Material) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-white">
            <CarOutlined className="text-cyan-400" />
            <span className="font-mono">{record.plateNumber}</span>
          </div>
          <div className="text-gray-400 text-xs">单号: {record.deliveryOrderNo}</div>
        </div>
      )
    },
    {
      title: '送货重量',
      dataIndex: 'deliveryWeight',
      key: 'deliveryWeight',
      width: 110,
      render: (w: number) => <span className="font-mono">{w} 吨</span>
    },
    {
      title: '过磅重量',
      dataIndex: 'actualWeight',
      key: 'actualWeight',
      width: 110,
      render: (w: number) => <span className="font-mono text-cyan-300">{w} 吨</span>
    },
    {
      title: '重量偏差',
      key: 'weightDiff',
      width: 130,
      render: (_: any, record: Material) => {
        const isOver = Math.abs(record.weightDiffPercent) > 3
        return (
          <div className="text-sm">
            <div className={`font-mono ${
              record.weightDiffPercent < -3 ? 'text-red-400' : 
              record.weightDiffPercent > 3 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {record.weightDiffPercent > 0 ? '+' : ''}{record.weightDiffPercent}%
            </div>
            {isOver && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <WarningOutlined /> 超差
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '验收结果',
      dataIndex: 'acceptanceResult',
      key: 'acceptanceResult',
      width: 110,
      render: (status: string) => <StatusTag status={status} type="material" />
    },
    {
      title: '使用部位',
      dataIndex: 'usePosition',
      key: 'usePosition',
      width: 130
    },
    {
      title: '进场时间',
      dataIndex: 'entryTime',
      key: 'entryTime',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Material) => (
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
          <StockOutlined /> 物料进场验收
        </h2>
        <Space>
          <Tag color="green">通过: {stats.passed}</Tag>
          <Tag color="red">拒绝: {stats.rejected}</Tag>
          <Tag color="yellow">待验: {stats.pending}</Tag>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<RiseOutlined />}
        message="地磅数据自动采集，不可人工篡改，自动对比超差预警"
        description="系统自动对比送货单重量与过磅重量，偏差超过±3%自动预警，材料员确认验收。所有数据可追溯、可审计。"
        className="bg-blue-500/10 border-blue-500/30"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="总进场批次" value={stats.total} unit="批" icon={<StockOutlined />} color="cyan" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="今日进场" value={stats.today} unit="批" icon={<TruckOutlined />} color="blue" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="总进场量" value={stats.totalWeight.toFixed(0)} unit="吨" icon={<RiseOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="验收通过率" value={((stats.passed / stats.total) * 100).toFixed(1)} unit="%" icon={<CheckCircleOutlined />} color="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="待验收" value={stats.pending} unit="批" icon={<ClockCircleOutlined />} color="yellow" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard title="供应商数" value={suppliers.length} unit="家" icon={<CarOutlined />} color="cyan" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="panel" title={<span className="panel-title"><StockOutlined /> 月度进场趋势</span>} bordered={false}>
            <ReactECharts option={monthTrendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="panel" title={<span className="panel-title"><StockOutlined /> 材料类型分布</span>} bordered={false}>
            <ReactECharts option={materialTypeOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card className="panel" title={<span className="panel-title"><WarningOutlined /> 重量偏差监控（最近20车）</span>} bordered={false}>
        <ReactECharts option={weightDiffOption} style={{ height: 200 }} />
      </Card>

      <Card className="panel" bordered={false}>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            placeholder="供应商筛选"
            allowClear
            size="large"
            style={{ width: 200 }}
            value={supplierFilter === 'all' ? undefined : supplierFilter}
            onChange={(v) => setSupplierFilter(v || 'all')}
          >
            {suppliers.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <Select
            placeholder="验收结果"
            allowClear
            size="large"
            style={{ width: 150 }}
            value={resultFilter === 'all' ? undefined : resultFilter}
            onChange={(v) => setResultFilter(v || 'all')}
          >
            <Option value="passed">验收通过</Option>
            <Option value="rejected">验收拒绝</Option>
            <Option value="pending">待验收</Option>
          </Select>
        </div>

        <div className="mb-2 text-sm text-gray-400">
          共 {filteredMaterials.length} 条记录
        </div>

        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          scroll={{ x: 1400 }}
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
        title="材料验收详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={selectedMaterial?.acceptanceResult === 'pending' ? [
          <Button key="reject" danger onClick={() => openRemarkDialog('rejected')}>
            <CloseCircleOutlined /> 验收拒绝
          </Button>,
          <Button key="pass" type="primary" onClick={() => openRemarkDialog('passed')}>
            <CheckCircleOutlined /> 验收通过
          </Button>
        ] : null}
        width={900}
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <Descriptions column={2} bordered size="small" className="text-sm">
              <Descriptions.Item label="材料名称">{selectedMaterial.name}</Descriptions.Item>
              <Descriptions.Item label="规格型号">{selectedMaterial.spec}</Descriptions.Item>
              <Descriptions.Item label="供应商">{selectedMaterial.supplier}</Descriptions.Item>
              <Descriptions.Item label="使用部位">{selectedMaterial.usePosition}</Descriptions.Item>
              <Descriptions.Item label="车牌号码">
                <span className="font-mono">{selectedMaterial.plateNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="送货单号">
                <span className="font-mono">{selectedMaterial.deliveryOrderNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="送货单重量">
                <span className="font-mono">{selectedMaterial.deliveryWeight} 吨</span>
              </Descriptions.Item>
              <Descriptions.Item label="过磅重量">
                <span className="font-mono text-cyan-300">{selectedMaterial.actualWeight} 吨</span>
              </Descriptions.Item>
              <Descriptions.Item label="重量差值">
                <span className={`font-mono ${
                  selectedMaterial.weightDiff < 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {selectedMaterial.weightDiff > 0 ? '+' : ''}{selectedMaterial.weightDiff} 吨
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="偏差率">
                <span className={`font-mono font-bold ${
                  Math.abs(selectedMaterial.weightDiffPercent) > 3 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {selectedMaterial.weightDiffPercent > 0 ? '+' : ''}{selectedMaterial.weightDiffPercent}%
                </span>
                {Math.abs(selectedMaterial.weightDiffPercent) > 3 && (
                  <Tag color="red" className="ml-2">超差预警</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="验收结果">
                <StatusTag status={selectedMaterial.acceptanceResult} type="material" />
              </Descriptions.Item>
              <Descriptions.Item label="过磅员">{selectedMaterial.operator}</Descriptions.Item>
              {selectedMaterial.acceptanceResult !== 'pending' && (
                <>
                  <Descriptions.Item label="验收员">
                    <span className="inline-flex items-center gap-1">
                      <UserOutlined /> {selectedMaterial.acceptanceOperator || '-'}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="验收时间">
                    {selectedMaterial.acceptanceTime || '-'}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="进场时间" span={2}>
                {selectedMaterial.entryTime}
              </Descriptions.Item>
              {selectedMaterial.acceptanceRemark && (
                <Descriptions.Item label="验收备注" span={2}>
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
                    {selectedMaterial.acceptanceRemark}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <div className="text-cyan-300 font-medium mb-3 flex items-center gap-2">
                <CameraOutlined /> 过磅现场照片
              </div>
              <Row gutter={[16, 16]}>
                {selectedMaterial.images.map((img, i) => (
                  <Col xs={12} md={8} key={i}>
                    <Image
                      width="100%"
                      src={img}
                      style={{ borderRadius: 8 }}
                    />
                  </Col>
                ))}
              </Row>
            </div>

            <Alert
              type="info"
              showIcon
              message="数据溯源"
              description={`本批次材料地磅数据自动采集，拍照留证，所有记录不可篡改。单号：${selectedMaterial.deliveryOrderNo}，可追溯审计。`}
              className="bg-blue-500/10 border-blue-500/30"
            />
          </div>
        )}
      </Modal>

      <Modal
        title={pendingAcceptType === 'passed' ? '确认验收通过' : '确认验收拒绝'}
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        confirmLoading={submitting}
        onOk={handleAcceptance}
        okText="确认提交"
        width={520}
        destroyOnClose
      >
        <Form form={remarkForm} layout="vertical" preserve={false}>
          {selectedMaterial && Math.abs(selectedMaterial.weightDiffPercent) > 3 && pendingAcceptType === 'passed' && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`重量超差预警：偏差率 ${selectedMaterial.weightDiffPercent > 0 ? '+' : ''}${selectedMaterial.weightDiffPercent}%`}
              description="本批次材料与送货单重量差异超过±3%阈值，请材料员谨慎确认并说明理由。"
              className="mb-4 bg-yellow-500/10 border-yellow-500/30"
            />
          )}
          <Form.Item
            label="材料员姓名"
            name="operator"
            rules={[{ required: true, message: '请填写材料员姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入或确认材料员姓名" />
          </Form.Item>
          <Form.Item
            label={pendingAcceptType === 'passed' ? (selectedMaterial && Math.abs(selectedMaterial.weightDiffPercent) > 3 ? '超差确认说明（必填）' : '验收备注（选填）') : '拒绝原因（必填）'}
            name="remark"
            rules={[
              {
                required: !!(pendingAcceptType === 'rejected' || (selectedMaterial && Math.abs(selectedMaterial.weightDiffPercent) > 3)),
                message: '请填写说明'
              }
            ]}
          >
            <TextArea
              rows={4}
              placeholder={pendingAcceptType === 'passed'
                ? (selectedMaterial && Math.abs(selectedMaterial.weightDiffPercent) > 3
                    ? '请详细说明超差可通过的原因，如：材料含水率差异、过磅误差可接受、现场抽检合格等...'
                    : '可选填验收意见，如规格符合要求、数量准确、质量合格等...')
                : '请详细说明验收拒绝原因，如：规格型号不符、数量严重不足、外观有损伤、检测不合格等...'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
