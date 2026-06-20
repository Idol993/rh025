import { useMemo } from 'react'
import { Card, Row, Col, Progress, List, Avatar, Space, Tag } from 'antd'
import {
  TeamOutlined,
  SafetyOutlined,
  ToolOutlined,
  RiseOutlined,
  StockOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import StatCard from '@/components/StatCard'
import GaugeChart from '@/components/GaugeChart'
import StatusTag from '@/components/StatusTag'
import { useAppStore } from '@/store/useStore'

export default function Dashboard() {
  const { stats, workers, safetyAlerts, equipment, workOrders, progressTasks, materials } = useAppStore()

  const workTypeStats = useMemo(() => {
    const map: Record<string, number> = {}
    workers.filter(w => w.status === 'on-site').forEach(w => {
      map[w.workType] = (map[w.workType] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [workers])

  const teamStats = useMemo(() => {
    const map: Record<string, number> = {}
    workers.forEach(w => {
      map[w.team] = (map[w.team] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [workers])

  const alertTypeStats = useMemo(() => {
    const map: Record<string, number> = {}
    safetyAlerts.forEach(a => {
      map[a.typeName] = (map[a.typeName] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [safetyAlerts])

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
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: 'rgba(10, 22, 40, 0.8)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        }
      },
      data: workTypeStats
    }],
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']
  }

  const progressChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      name: '完成率 (%)',
      axisLine: { lineStyle: { color: '#rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '计划进度',
        type: 'line',
        smooth: true,
        data: [10, 20, 35, 50, 65, 80],
        lineStyle: { color: '#faad14', width: 3 },
        itemStyle: { color: '#faad14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.3)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.05)' }
            ]
          }
        }
      },
      {
        name: '实际进度',
        type: 'line',
        smooth: true,
        data: [8, 18, 30, 42, 55, 45.6],
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
        }
      }
    ]
  }

  const safetyTrendOption = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' }
    },
    yAxis: {
      type: 'value',
      name: '预警次数',
      axisLine: { lineStyle: { color: '#rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8fa3b8' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [{
      data: [15, 22, 18, 25, 20, 12, 18],
      type: 'bar',
      barWidth: '50%',
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
    }]
  }

  const equipmentStatusData = useMemo(() => {
    const running = equipment.filter(e => e.status === 'running').length
    const warning = equipment.filter(e => e.status === 'warning').length
    const danger = equipment.filter(e => e.status === 'danger').length
    return [
      { name: '运行正常', value: running, color: '#52c41a' },
      { name: '预警状态', value: warning, color: '#faad14' },
      { name: '危险状态', value: danger, color: '#f5222d' }
    ]
  }, [equipment])

  const equipmentChartOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['50%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: 'rgba(10, 22, 40, 0.8)',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: `{a|${stats.equipmentRunning}}\n{b|运行中}`,
        rich: {
          a: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#52c41a'
          },
          b: {
            fontSize: 12,
            color: '#8fa3b8',
            padding: [5, 0, 0, 0]
          }
        }
      },
      data: equipmentStatusData.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: item.color }
      }))
    }]
  }

  const recentAlerts = safetyAlerts.slice(0, 5)
  const recentOrders = workOrders.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-300 glow-text mb-2">
          智慧新城一期项目 - 智慧工地管理平台
        </h1>
        <p className="text-gray-400">
          安全 · 进度 · 成本 · 劳务 · 合规 · 五维一体化智能管理
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="总人数"
            value={stats.totalWorkers}
            unit="人"
            icon={<TeamOutlined />}
            trend={5.2}
            color="cyan"
            suffix={
              <span className="text-xs text-gray-400 ml-2">
                在场 <span className="text-green-400 font-bold">{stats.onSiteWorkers}</span> 人
              </span>
            }
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="今日安全预警"
            value={stats.todayAlerts}
            unit="条"
            icon={<WarningOutlined />}
            trend={-12.5}
            color="yellow"
            suffix={
              <span className="text-xs text-gray-400 ml-2">
                已处理 <span className="text-green-400 font-bold">{Math.floor(stats.todayAlerts * 0.72)}</span>
              </span>
            }
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="待整改工单"
            value={stats.pendingWorkOrders}
            unit="条"
            icon={<SafetyOutlined />}
            trend={-8.3}
            color="red"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="整体施工进度"
            value={stats.totalProgress}
            unit="%"
            icon={<RiseOutlined />}
            trend={2.1}
            color="green"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="安全评分"
            value={stats.safetyScore}
            unit="分"
            icon={<CheckCircleOutlined />}
            trend={1.5}
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="今日进场材料"
            value={stats.todayMaterialIn}
            unit="批次"
            icon={<StockOutlined />}
            trend={15.6}
            color="cyan"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="设备总数"
            value={stats.equipmentCount}
            unit="台"
            icon={<ToolOutlined />}
            color="blue"
            suffix={
              <span className="text-xs text-gray-400 ml-2">
                在线 <span className="text-green-400 font-bold">{stats.equipmentRunning}</span> 台
              </span>
            }
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="隐患整改闭环率"
            value="98.5"
            unit="%"
            icon={<ClockCircleOutlined />}
            trend={3.2}
            color="green"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="panel" title={<span className="panel-title"><RiseOutlined /> 进度趋势对比</span>} bordered={false}>
            <ReactECharts option={progressChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="panel" title={<span className="panel-title"><WarningOutlined /> 本周安全预警趋势</span>} bordered={false}>
            <ReactECharts option={safetyTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><TeamOutlined /> 工种分布</span>} bordered={false}>
            <ReactECharts option={workTypeChartOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><CheckCircleOutlined /> 安全指标</span>} bordered={false}>
            <div className="grid grid-cols-2 gap-4">
              <GaugeChart value={stats.safetyScore} name="安全评分" color="#52c41a" />
              <GaugeChart value={98.5} name="整改闭环率" color="#1890ff" />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><ToolOutlined /> 设备运行状态</span>} bordered={false}>
            <ReactECharts option={equipmentChartOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><StockOutlined /> 今日进场材料</span>} bordered={false}>
            <List
              size="small"
              dataSource={materials.slice(0, 6)}
              renderItem={(item) => (
                <List.Item className="!border-b !border-dashed !border-border-glow !py-2">
                  <div className="flex-1">
                    <div className="text-sm text-white">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.spec} · {item.plateNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-cyan-300 font-mono">{item.actualWeight} 吨</div>
                    <StatusTag status={item.acceptanceResult} type="material" />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            className="panel" 
            title={<span className="panel-title"><WarningOutlined /> 最新安全预警</span>} 
            bordered={false}
            extra={<a className="text-cyan-400 text-sm hover:text-cyan-300">查看全部 →</a>}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentAlerts}
              renderItem={(item) => (
                <List.Item className="!border-b !border-dashed !border-border-glow !py-3">
                  <List.Item.Meta
                    avatar={<Avatar src={item.imageUrl} shape="square" size={64} />}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="text-white">{item.typeName}</span>
                        <StatusTag status={item.level} />
                        <StatusTag status={item.status} type="alert" />
                      </div>
                    }
                    description={
                      <div className="text-xs text-gray-400">
                        <div>位置: {item.location}</div>
                        <div>时间: {item.captureTime}</div>
                        {item.handler && <div>处理人: {item.handler}</div>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            className="panel" 
            title={<span className="panel-title"><ClockCircleOutlined /> 最新整改工单</span>} 
            bordered={false}
            extra={<a className="text-cyan-400 text-sm hover:text-cyan-300">查看全部 →</a>}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentOrders}
              renderItem={(item) => (
                <List.Item className="!border-b !border-dashed !border-border-glow !py-3">
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: item.type === 'safety' ? '#f5222d' : 
                                          item.type === 'quality' ? '#faad14' : 
                                          item.type === 'progress' ? '#1890ff' : '#722ed1' 
                        }} 
                        icon={
                          item.type === 'safety' ? <SafetyOutlined /> : 
                          item.type === 'quality' ? <CheckCircleOutlined /> : 
                          item.type === 'progress' ? <RiseOutlined /> : <ToolOutlined />
                        } 
                      />
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="text-white">{item.title}</span>
                        <StatusTag status={item.level} />
                      </div>
                    }
                    description={
                      <div className="text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                          <span>位置: {item.location}</span>
                          <StatusTag status={item.status} type="workorder" />
                        </div>
                        <div>上报人: {item.reporter} · {item.reportTime}</div>
                        <div>负责人: {item.handler} · 截止: {item.deadline}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card className="panel" title={<span className="panel-title"><RiseOutlined /> 关键任务进度跟踪</span>} bordered={false}>
            <Row gutter={[16, 16]}>
              {progressTasks.filter(t => t.isCritical).slice(0, 6).map((task) => (
                <Col xs={24} md={12} lg={8} key={task.id}>
                  <div className="p-4 rounded-lg bg-white/5 border border-border-glow hover:border-primary transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white font-medium">{task.name}</div>
                        <div className="text-xs text-gray-400">{task.wbsCode} · {task.building} {task.floor}层</div>
                      </div>
                      <StatusTag status={task.status} type="task" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress 
                        percent={task.progress} 
                        size="small" 
                        strokeColor={task.status === 'delayed' ? '#f5222d' : task.status === 'completed' ? '#52c41a' : '#1890ff'}
                        showInfo={false}
                      />
                      <span className={`text-sm font-bold ${
                        task.status === 'delayed' ? 'text-red-400' : 
                        task.status === 'completed' ? 'text-green-400' : 'text-cyan-400'
                      }`}>
                        {task.progress}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>计划: {task.plannedStart} ~ {task.plannedEnd}</span>
                      {task.actualStart && <span>实际: {task.actualStart}</span>}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><TeamOutlined /> 各班组人数</span>} bordered={false}>
            <div className="space-y-3">
              {teamStats.slice(0, 6).map((item, index) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-cyan-300 font-mono">{item.value}人</span>
                  </div>
                  <Progress 
                    percent={Math.round(item.value / Math.max(...teamStats.map(t => t.value)) * 100)} 
                    showInfo={false}
                    size="small"
                    strokeColor={['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#fa8c16'][index]}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><WarningOutlined /> 预警类型分布</span>} bordered={false}>
            <div className="space-y-3">
              {alertTypeStats.map((item, index) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-cyan-300 font-mono">{item.value}次</span>
                  </div>
                  <Progress 
                    percent={Math.round(item.value / Math.max(...alertTypeStats.map(t => t.value)) * 100)} 
                    showInfo={false}
                    size="small"
                    strokeColor={['#f5222d', '#faad14', '#722ed1', '#1890ff', '#13c2c2'][index]}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><DollarOutlined /> 劳务工资发放</span>} bordered={false}>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-400 glow-text">¥ 1,258,600</div>
              <div className="text-sm text-gray-400 mt-1">本月应发工资总额</div>
            </div>
            <div className="space-y-2">
              <div className="data-item">
                <span className="text-gray-400">已发放</span>
                <span className="text-green-400">¥ 986,500</span>
              </div>
              <div className="data-item">
                <span className="text-gray-400">待发放</span>
                <span className="text-yellow-400">¥ 272,100</span>
              </div>
              <div className="data-item">
                <span className="text-gray-400">发放率</span>
                <span className="text-cyan-300">78.4%</span>
              </div>
              <div className="data-item">
                <span className="text-gray-400">涉及工人</span>
                <span className="text-white">295 人</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="panel" title={<span className="panel-title"><SafetyOutlined /> 核心规则执行情况</span>} bordered={false}>
            <div className="space-y-3">
              {[
                { name: '未培训禁入场', value: '100%', status: 'success' },
                { name: '证件过期禁入场', value: '100%', status: 'success' },
                { name: 'AI违规自动派单', value: '100%', status: 'success' },
                { name: '特种设备危险锁机', value: '98.5%', status: 'warning' },
                { name: '工资专户发放', value: '95.2%', status: 'success' },
                { name: '数据可追溯审计', value: '100%', status: 'success' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-dashed border-border-glow last:border-0">
                  <div className="flex items-center gap-2">
                    {item.status === 'success' ? (
                      <CheckCircleOutlined className="text-green-400" />
                    ) : (
                      <WarningOutlined className="text-yellow-400" />
                    )}
                    <span className="text-sm text-gray-300">{item.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.status === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
