import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Dropdown, Select, Badge } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  SafetyOutlined,
  ToolOutlined,
  StockOutlined,
  RiseOutlined,
  DollarOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useAppStore } from '@/store/useStore'

const { Header, Sider, Content } = AntLayout
const { Option } = Select

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '项目驾驶舱' },
  { key: '/personnel', icon: <TeamOutlined />, label: '人员实名制' },
  { key: '/safety', icon: <SafetyOutlined />, label: 'AI安全监管' },
  { key: '/equipment', icon: <ToolOutlined />, label: '设备物联监测' },
  { key: '/material', icon: <StockOutlined />, label: '物料进场验收' },
  { key: '/progress', icon: <RiseOutlined />, label: '进度智能对比' },
  { key: '/salary', icon: <DollarOutlined />, label: '工资专户发放' },
  { key: '/workorder', icon: <FileTextOutlined />, label: '隐患闭环整改' },
  { key: '/group', icon: <ApartmentOutlined />, label: '集团多级监管' }
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, projects, selectedProject, setSelectedProject, stats } = useAppStore()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
  ]

  return (
    <AntLayout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        className="bg-darker border-r border-border-glow"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-border-glow">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <ApartmentOutlined className="text-white" />
              </div>
              <span className="text-lg font-bold text-cyan-300 glow-text">智慧工地</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <ApartmentOutlined className="text-white" />
            </div>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="bg-transparent border-r-0 mt-4"
        />
      </Sider>

      <AntLayout className="bg-transparent">
        <Header className="bg-darker/80 backdrop-blur-sm h-16 px-4 flex items-center justify-between border-b border-border-glow">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<span className="text-white text-lg">{collapsed ? '☰' : '☰'}</span>}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              className="w-64"
              size="large"
              bordered={false}
              style={{ background: 'rgba(24, 144, 255, 0.1)' }}
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-cyan-300 font-mono">
              {formatDate(currentTime)}
            </div>
            
            <Badge count={stats.pendingWorkOrders + stats.todayAlerts} size="small">
              <Button type="text" icon={<BellOutlined className="text-white text-lg" />} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <UserOutlined className="text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">{currentUser.name}</div>
                  <div className="text-xs text-gray-400">{currentUser.roleName}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-4 overflow-auto">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
