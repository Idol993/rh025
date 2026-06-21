import { useState, useMemo, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Row, Col, Progress, List, Descriptions, message, Alert } from 'antd'
import { DollarOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, SearchOutlined, BankOutlined, UserOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'
import StatusTag from '@/components/StatusTag'
import type { SalaryRecord } from '@/types'
import { useSearchParams } from 'react-router-dom'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function Salary() {
  const { salaryRecords, workers, approveSalary, paySalary, retryPaySalary, currentUser } = useAppStore()
  const [selectedMonth, setSelectedMonth] = useState('2025-05')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter) setStatusFilter(filter)

    const detailId = searchParams.get('detailId')
    if (detailId) {
      const record = salaryRecords.find(r => r.id === detailId)
      if (record) {
        setCurrentRecord(record)
        setDetailModal(true)
      }
    }
  }, [searchParams, salaryRecords])
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [detailModal, setDetailModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SalaryRecord | null>(null)
  const [auditModal, setAuditModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const teams = useMemo(() => {
    const t = new Set(salaryRecords.map(r => r.team))
    return Array.from(t)
  }, [salaryRecords])

  const filteredRecords = useMemo(() => {
    return salaryRecords.filter(r => {
      const matchMonth = r.month === selectedMonth
      const matchSearch = r.workerName.includes(searchText) || r.workType.includes(searchText)
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchTeam = teamFilter === 'all' || r.team === teamFilter
      return matchMonth && matchSearch && matchStatus && matchTeam
    })
  }, [salaryRecords, selectedMonth, searchText, statusFilter, teamFilter])

  const stats = useMemo(() => {
    const monthRecords = salaryRecords.filter(r => r.month === selectedMonth)
    const totalAmount = monthRecords.reduce((sum, r) => sum + r.totalSalary, 0)
    const paidAmount = monthRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalSalary, 0)
    const pendingCount = monthRecords.filter(r => r.status === 'pending').length
    const paidCount = monthRecords.filter(r => r.status === 'paid').length
    const failedCount = monthRecords.filter(r => r.status === 'failed').length
    const approvedCount = monthRecords.filter(r => r.status === 'approved').length
    const avgSalary = monthRecords.length > 0 ? Math.floor(totalAmount / monthRecords.length) : 0

    return {
      totalCount: monthRecords.length,
      totalAmount,
      paidAmount,
      pendingCount,
      paidCount,
      failedCount,
      approvedCount,
      avgSalary,
      payRate: monthRecords.length > 0 ? Number(((paidCount / monthRecords.length) * 100).toFixed(1)) : 0
    }
  }, [salaryRecords, selectedMonth])

  const monthlyTrend = useMemo(() => {
    const months = ['2025-03', '2025-04', '2025-05']
    return months.map(m => {
      const records = salaryRecords.filter(r => r.month === m)
      return {
        month: m,
        total: records.reduce((sum, r) => sum + r.totalSalary, 0),
        paid: records.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalSalary, 0),
        count: records.length
      }
    })
  }, [salaryRecords])

  const teamSalaryStats = useMemo(() => {
    const map = new Map<string, { total: number; count: number; avg: number }>()
    const monthRecords = salaryRecords.filter(r => r.month === selectedMonth)
    
    monthRecords.forEach(r => {
      if (!map.has(r.team)) {
        map.set(r.team, { total: 0, count: 0, avg: 0 })
      }
      const data = map.get(r.team)!
      data.total += r.totalSalary
      data.count += 1
    })
    
    return Array.from(map.entries()).map(([team, data]) => ({
      team,
      total: data.total,
      count: data.count,
      avg: Math.floor(data.total / data.count)
    })).sort((a, b) => b.total - a.total)
  }, [salaryRecords, selectedMonth])

  const workTypeSalaryStats = useMemo(() => {
    const map = new Map<string, number[]>()
    const monthRecords = salaryRecords.filter(r => r.month === selectedMonth)
    
    monthRecords.forEach(r => {
      if (!map.has(r.workType)) {
        map.set(r.workType, [])
      }
      map.get(r.workType)!.push(r.totalSalary)
    })
    
    return Array.from(map.entries()).map(([type, salaries]) => ({
      type,
      avg: Math.floor(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length
    })).sort((a, b) => b.avg - a.avg).slice(0, 8)
  }, [salaryRecords, selectedMonth])

  const salaryWarnings = useMemo(() => {
    const warnings: Array<{ id: string; type: string; message: string; level: string }> = []
    const monthRecords = salaryRecords.filter(r => r.month === selectedMonth)
    
    monthRecords.forEach(r => {
      if (r.status === 'failed') {
        warnings.push({
          id: r.id,
          type: '发放失败',
          message: `${r.workerName}(${r.workType}) 工资发放失败，请检查银行账户信息`,
          level: 'high'
        })
      }
      if (r.attendanceDays < 15 && r.totalSalary > 8000) {
        warnings.push({
          id: r.id,
          type: '数据异常',
          message: `${r.workerName}(${r.workType}) 出勤${r.attendanceDays}天，但工资高达¥${r.totalSalary}，请核实`,
          level: 'medium'
        })
      }
      if (r.overtimeHours > 60) {
        warnings.push({
          id: r.id,
          type: '加班超时',
          message: `${r.workerName}(${r.workType}) 本月加班${r.overtimeHours}小时，超过法定上限`,
          level: 'medium'
        })
      }
    })
    
    return warnings.slice(0, 8)
  }, [salaryRecords, selectedMonth])

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    legend: {
      data: ['应发总额', '实发总额', '发放人数'],
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
      data: monthlyTrend.map(m => m.month),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(万元)',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: {
          color: '#94a3b8',
          formatter: (v: number) => (v / 10000).toFixed(0)
        },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      {
        type: 'value',
        name: '人数',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '应发总额',
        type: 'bar',
        data: monthlyTrend.map(m => m.total),
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
        name: '实发总额',
        type: 'bar',
        data: monthlyTrend.map(m => m.paid),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#10b981' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '发放人数',
        type: 'line',
        yAxisIndex: 1,
        data: monthlyTrend.map(m => m.count),
        smooth: true,
        lineStyle: { color: '#f59e0b', width: 3 },
        itemStyle: { color: '#f59e0b' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0)' }
            ]
          }
        }
      }
    ]
  }

  const teamChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: {
        color: '#94a3b8',
        formatter: (v: number) => (v / 10000).toFixed(1) + '万'
      },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    yAxis: {
      type: 'category',
      data: teamSalaryStats.map(t => t.team),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' }
    },
    series: [
      {
        type: 'bar',
        data: teamSalaryStats.map(t => ({
          value: t.total,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 1, color: '#6366f1' }
              ]
            },
            borderRadius: [0, 4, 4, 0]
          }
        })),
        label: {
          show: true,
          position: 'right',
          color: '#e2e8f0',
          formatter: (p: any) => (p.value / 10000).toFixed(2) + '万'
        }
      }
    ]
  }

  const workTypeChartOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#94a3b8' }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#e2e8f0'
          }
        },
        data: workTypeSalaryStats.map((t, i) => ({
          value: t.avg,
          name: t.type,
          itemStyle: {
            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'][i]
          }
        }))
      }
    ]
  }

  const columns = [
    {
      title: '工人信息',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 120,
      render: (text: string, record: SalaryRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <UserOutlined className="text-blue-400 text-sm" />
          </div>
          <div>
            <div className="text-white text-sm">{text}</div>
            <div className="text-gray-400 text-xs">{record.workType}</div>
          </div>
        </div>
      )
    },
    {
      title: '所属班组',
      dataIndex: 'team',
      key: 'team',
      width: 100,
      render: (text: string) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '出勤天数',
      dataIndex: 'attendanceDays',
      key: 'attendanceDays',
      width: 80,
      render: (days: number) => <span className="text-white">{days}天</span>
    },
    {
      title: '工作时长',
      key: 'hours',
      width: 120,
      render: (_: any, record: SalaryRecord) => (
        <div>
          <div className="text-white text-sm">正常: {record.workHours}h</div>
          <div className="text-orange-400 text-xs">加班: {record.overtimeHours}h</div>
        </div>
      )
    },
    {
      title: '工资明细',
      key: 'salaryDetail',
      width: 180,
      render: (_: any, record: SalaryRecord) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">基本工资</span>
            <span className="text-white">¥{record.basicSalary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">加班工资</span>
            <span className="text-orange-400">¥{record.overtimeSalary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">补贴</span>
            <span className="text-green-400">¥{record.subsidy.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm pt-1 border-t border-gray-700">
            <span className="text-white font-medium">合计</span>
            <span className="text-cyan-400 font-bold">¥{record.totalSalary.toLocaleString()}</span>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <StatusTag status={status} type="salary" />
    },
    {
      title: '发放时间',
      dataIndex: 'paidTime',
      key: 'paidTime',
      width: 150,
      render: (time?: string) => time ? <span className="text-gray-300">{time}</span> : <span className="text-gray-500">-</span>
    },
    {
      title: '银行流水号',
      dataIndex: 'bankFlowNo',
      key: 'bankFlowNo',
      width: 150,
      render: (no?: string) => no ? <span className="text-cyan-400 font-mono text-xs">{no}</span> : <span className="text-gray-500">-</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: SalaryRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentRecord(record)
              setDetailModal(true)
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setCurrentRecord(record)
                form.setFieldsValue({
                  auditComment: '工资数据审核通过，同意发放'
                })
                setAuditModal(true)
              }}
            >
              审核
            </Button>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              size="small"
              icon={<BankOutlined />}
              onClick={() => {
                setCurrentRecord(record)
                setPayModal(true)
              }}
            >
              发放
            </Button>
          )}
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<WarningOutlined />}
              onClick={() => handleRetryPay(record)}
            >
              重试
            </Button>
          )}
        </Space>
      )
    }
  ]

  const handleAudit = async () => {
    try {
      setSubmitting(true)
      await form.validateFields()
      if (currentRecord) {
        approveSalary([currentRecord.id])
        message.success(`审核通过！工资记录「${currentRecord.workerName}」已提交发放队列，审核人：${currentUser.name}`)
      }
      setAuditModal(false)
      form.resetFields()
    } catch (e: any) {
      if (e?.errorFields) return
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = () => {
    if (!currentRecord) return
    setSubmitting(true)
    paySalary([currentRecord.id])
    setTimeout(() => {
      setSubmitting(false)
      setPayModal(false)
      message.success(`工资已发放至「${currentRecord.workerName}」银行账户，银行流水号已生成。`)
    }, 800)
  }

  const handleBatchPay = () => {
    const ids = salaryRecords.filter(r => r.month === selectedMonth && r.status === 'approved').map(r => r.id)
    if (ids.length === 0) {
      message.warning('当前月份暂无已审核通过待发放的工资记录')
      return
    }
    const amount = salaryRecords
      .filter(r => r.month === selectedMonth && r.status === 'approved')
      .reduce((s, r) => s + r.totalSalary, 0)
    Modal.confirm({
      title: '确认批量发放',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">发放月份：</span>
            <span>{selectedMonth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">发放条数：</span>
            <span>{ids.length} 条</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">发放总金额：</span>
            <span className="text-cyan-300 font-bold text-lg font-mono">¥{amount.toLocaleString()}</span>
          </div>
          <Alert
            type="info"
            showIcon
            message="银行专户批量划转"
            description="系统将通过对接工资专户银行接口，按批次完成自动发放，发放记录、银行流水、签收凭证将自动归档。"
            className="mt-3 !bg-blue-500/10 !border-blue-500/30"
          />
        </div>
      ),
      okText: '确认发放',
      cancelText: '取消',
      onOk: async () => {
        setSubmitting(true)
        paySalary(ids)
        setTimeout(() => {
          setSubmitting(false)
          message.success(`已成功提交 ${ids.length} 条发放指令至银行专户，合计 ¥${amount.toLocaleString()}`)
        }, 1000)
      }
    })
  }

  const handleRetryPay = (record: SalaryRecord) => {
    Modal.confirm({
      title: '重新发放工资',
      content: (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">工人：</span>
            <span>{record.workerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">发放金额：</span>
            <span className="text-cyan-300 font-mono font-bold">¥{record.totalSalary.toLocaleString()}</span>
          </div>
          <div className="text-xs text-yellow-300 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
            <WarningOutlined className="mr-1" />
            此前发放失败，正在请求银行专户接口重试。请确认银行账户信息正常。
          </div>
        </div>
      ),
      okText: '重新发放',
      cancelText: '取消',
      onOk: () => {
        retryPaySalary(record.id)
        message.success(`已重新发放工资至「${record.workerName}」，银行流水号已生成。`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">劳务工资专户发放</h1>
          <p className="text-gray-400 mt-1">工资数据三级审核 · 银行专户自动发放 · 欠薪预警监管</p>
        </div>
        <Space>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="w-32"
            options={[
              { value: '2025-05', label: '2025年05月' },
              { value: '2025-04', label: '2025年04月' },
              { value: '2025-03', label: '2025年03月' }
            ]}
          />
          <Button type="primary" icon={<BankOutlined />} onClick={handleBatchPay}>
            批量发放 ({stats.approvedCount})
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="应发工资总额"
            value={`¥${(stats.totalAmount / 10000).toFixed(2)}万`}
            icon={<DollarOutlined />}
            color="blue"
            trend={8.5}
            trendLabel="较上月"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="实发工资总额"
            value={`¥${(stats.paidAmount / 10000).toFixed(2)}万`}
            icon={<CheckCircleOutlined />}
            color="green"
            trend={12.3}
            trendLabel="较上月"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="平均工资"
            value={`¥${stats.avgSalary.toLocaleString()}`}
            icon={<TeamOutlined />}
            color="purple"
            subValue={`发放 ${stats.totalCount} 人`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="发放率"
            value={`${stats.payRate}%`}
            icon={<FileTextOutlined />}
            color="cyan"
            trend={stats.payRate - 85}
            trendLabel="较上月"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">发放状态分布</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-400" /> 已发放
                  </span>
                  <span className="text-white">{stats.paidCount}人</span>
                </div>
                <Progress percent={stats.totalCount > 0 ? (stats.paidCount / stats.totalCount) * 100 : 0} showInfo={false} strokeColor="#10b981" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-2">
                    <ClockCircleOutlined className="text-blue-400" /> 已审核
                  </span>
                  <span className="text-white">{stats.approvedCount}人</span>
                </div>
                <Progress percent={stats.totalCount > 0 ? (stats.approvedCount / stats.totalCount) * 100 : 0} showInfo={false} strokeColor="#3b82f6" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-2">
                    <ClockCircleOutlined className="text-yellow-400" /> 待审核
                  </span>
                  <span className="text-white">{stats.pendingCount}人</span>
                </div>
                <Progress percent={stats.totalCount > 0 ? (stats.pendingCount / stats.totalCount) * 100 : 0} showInfo={false} strokeColor="#f59e0b" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-2">
                    <CloseCircleOutlined className="text-red-400" /> 发放失败
                  </span>
                  <span className="text-white">{stats.failedCount}人</span>
                </div>
                <Progress percent={stats.totalCount > 0 ? (stats.failedCount / stats.totalCount) * 100 : 0} showInfo={false} strokeColor="#ef4444" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={18}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">工资发放趋势</h3>
            </div>
            <ReactECharts option={trendChartOption} style={{ height: '280px' }} theme="dark" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">各班组工资总额</h3>
            </div>
            <ReactECharts option={teamChartOption} style={{ height: '300px' }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="panel h-full" styles={{ body: { padding: '20px' } }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">工种平均工资对比</h3>
            </div>
            <ReactECharts option={workTypeChartOption} style={{ height: '300px' }} theme="dark" />
          </Card>
        </Col>
      </Row>

      <Card className="panel" styles={{ body: { padding: '20px' } }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <WarningOutlined className="text-yellow-400" />
            工资异常预警
          </h3>
          <Tag color="red" className="animate-pulse">{salaryWarnings.length} 条预警</Tag>
        </div>
        <List
          dataSource={salaryWarnings}
          renderItem={(item) => (
            <List.Item className="border-b border-gray-700/50 py-3 hover:bg-white/5 transition-colors">
              <List.Item.Meta
                avatar={
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.level === 'high' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <WarningOutlined className={item.level === 'high' ? 'text-red-400' : 'text-yellow-400'} />
                  </div>
                }
                title={
                  <div className="flex items-center gap-2">
                    <Tag color={item.level === 'high' ? 'red' : 'orange'}>{item.type}</Tag>
                    <span className="text-white text-sm">{item.message}</span>
                  </div>
                }
                description={
                  <div className="flex items-center gap-4 mt-2">
                    <Button type="link" size="small" danger>立即处理</Button>
                    <Button type="link" size="small">标记已读</Button>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card className="panel" styles={{ body: { padding: '20px' } }}>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h3 className="text-white font-medium">工资发放明细</h3>
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <Input
              placeholder="搜索工人姓名/工种"
              prefix={<SearchOutlined className="text-gray-500" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-48 bg-slate-800/50 border-slate-600"
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-32 bg-slate-800/50"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已审核' },
                { value: 'paid', label: '已发放' },
                { value: 'failed', label: '发放失败' }
              ]}
            />
            <Select
              placeholder="班组筛选"
              value={teamFilter}
              onChange={setTeamFilter}
              className="w-36 bg-slate-800/50"
              options={[
                { value: 'all', label: '全部班组' },
                ...teams.map(t => ({ value: t, label: t }))
              ]}
            />
            <RangePicker className="bg-slate-800/50" />
          </div>
          <Button type="primary" ghost>导出工资表</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
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
                工资数据必须经过「班组报审 → 项目经理审核」两级审核后方可发放
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                工资必须通过劳务工资专户银行接口发放，严禁现金或私人账户发放
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                发放失败、数据异常、专户余额不足必须触发欠薪预警并推送监管
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                发放记录、银行流水、签收凭证自动归档，永久保留可追溯
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title="工资详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={600}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentRecord && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <UserOutlined className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{currentRecord.workerName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color="blue">{currentRecord.workType}</Tag>
                  <Tag color="purple">{currentRecord.team}</Tag>
                  <StatusTag status={currentRecord.status} type="salary" />
                </div>
              </div>
            </div>

            <Descriptions column={2} bordered size="small" className="descriptions-dark">
              <Descriptions.Item label="工资月份">{currentRecord.month}</Descriptions.Item>
              <Descriptions.Item label="出勤天数">{currentRecord.attendanceDays}天</Descriptions.Item>
              <Descriptions.Item label="正常工时">{currentRecord.workHours}小时</Descriptions.Item>
              <Descriptions.Item label="加班工时">{currentRecord.overtimeHours}小时</Descriptions.Item>
              <Descriptions.Item label="基本工资">¥{currentRecord.basicSalary.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="加班工资">¥{currentRecord.overtimeSalary.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="补贴">¥{currentRecord.subsidy.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="应发合计" className="text-cyan-400">
                <span className="text-cyan-400 font-bold">¥{currentRecord.totalSalary.toLocaleString()}</span>
              </Descriptions.Item>
              {currentRecord.bankFlowNo && (
                <>
                  <Descriptions.Item label="银行流水号" span={2}>
                    <span className="font-mono text-cyan-400">{currentRecord.bankFlowNo}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="发放时间" span={2}>
                    {currentRecord.paidTime}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Card size="small" className="bg-slate-800/50 border-slate-600" styles={{ body: { padding: '12px' } }}>
              <h4 className="text-white text-sm font-medium mb-3">三级审核流程</h4>
              <div className="flex items-center">
                <div className="flex-1 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    true ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <UserOutlined />
                  </div>
                  <div className="text-xs text-gray-300 mt-2">班组报审</div>
                  <div className="text-xs text-gray-500 mt-1">{dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm')}</div>
                </div>
                <div className={`w-16 h-0.5 ${true ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                <div className="flex-1 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    currentRecord.status !== 'pending' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    <CheckCircleOutlined />
                  </div>
                  <div className="text-xs text-gray-300 mt-2">项目经理审核</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentRecord.status !== 'pending' ? dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm') : '待处理'}
                  </div>
                </div>
                <div className={`w-16 h-0.5 ${currentRecord.status === 'paid' || currentRecord.status === 'failed' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                <div className="flex-1 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    currentRecord.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    currentRecord.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    currentRecord.status === 'approved' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <BankOutlined />
                  </div>
                  <div className="text-xs text-gray-300 mt-2">银行发放</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentRecord.paidTime || (currentRecord.status === 'approved' ? '待发放' : currentRecord.status === 'failed' ? '发放失败' : '待处理')}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="工资审核"
        open={auditModal}
        onCancel={() => setAuditModal(false)}
        onOk={handleAudit}
        okText="审核通过"
        confirmLoading={submitting}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentRecord && (
          <div className="mb-4">
            <p className="text-gray-300 mb-2">
              确认审核 <span className="text-white font-medium">{currentRecord.workerName}</span> 的工资？
            </p>
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">应发工资</span>
                <span className="text-cyan-400 font-bold">¥{currentRecord.totalSalary.toLocaleString()}</span>
              </div>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="auditComment"
                label={<span className="text-gray-300">审核意见</span>}
                rules={[{ required: true, message: '请输入审核意见' }]}
              >
                <TextArea rows={3} className="bg-slate-800/50 border-slate-600" placeholder="请输入审核意见" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="确认发放"
        open={payModal}
        onCancel={() => setPayModal(false)}
        onOk={handlePay}
        okText="确认发放"
        okType="primary"
        confirmLoading={submitting}
        styles={{ content: { backgroundColor: '#1e293b', border: '1px solid #334155' } }}
      >
        {currentRecord && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <BankOutlined />
                <span className="font-medium">银行专户发放</span>
              </div>
              <p className="text-sm text-gray-300">
                将通过劳务工资专户向 <span className="text-white">{currentRecord.workerName}</span> 发放工资
              </p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">发放金额</span>
                <span className="text-2xl font-bold text-cyan-400">¥{currentRecord.totalSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">发放银行</span>
                <span className="text-white">中国建设银行（工资专户）</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              提示：发放指令提交后将由银行自动处理，到账时间以银行为准。发放记录将自动归档。
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
