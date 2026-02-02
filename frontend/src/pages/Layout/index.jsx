import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Input,
  Badge,
  Tooltip,
  Modal,
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TransactionOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MailOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@/store/slices/authSlice'
import { addTab } from '@/store/slices/tabsSlice'
import TabBar from '@/components/TabBar'
import './index.scss'

const { Header, Sider, Content } = AntLayout

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  // 标签页标签映射
  const pathLabelMap = {
    '/admin': '概览',
    '/admin/categories': '分类管理',
    '/admin/transactions': '交易流水',
    '/admin/statistics': '统计分析',
    '/admin/profile': '个人中心',
    '/admin/settings': '系统设置',
  }

  // 监听路由变化，自动添加标签页
  useEffect(() => {
    const label = pathLabelMap[location.pathname] || '页面'
    if (location.pathname.startsWith('/admin')) {
      dispatch(addTab({ path: location.pathname, label }))
    }
  }, [location.pathname, dispatch])

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '概览',
    },
    {
      key: '/admin/categories',
      icon: <AppstoreOutlined />,
      label: '分类管理',
    },
    {
      key: '/admin/transactions',
      icon: <TransactionOutlined />,
      label: '交易流水',
    },
    {
      key: '/admin/statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
    {
      key: '/admin/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        dispatch(logout())
        navigate('/login')
      },
    })
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout()
    } else if (key === 'profile') {
      navigate('/admin/profile')
    }
  }

  return (
    <AntLayout className="admin-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">{!collapsed ? '个人开支记账管理系统' : '记账'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header className="header">
          <div className="header-left">
            {collapsed ? (
              <MenuUnfoldOutlined
                className="trigger"
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined className="trigger" onClick={() => setCollapsed(!collapsed)} />
            )}
          </div>
          <div className="header-center">
            <Input.Search allowClear placeholder="搜索" className="header-search" />
          </div>
          <div className="header-right">
            <div className="header-actions">
              <Tooltip title="消息">
                <Badge count={12} size="small">
                  <MailOutlined className="action-icon" />
                </Badge>
              </Tooltip>
              <Tooltip title="通知">
                <Badge dot>
                  <BellOutlined className="action-icon" />
                </Badge>
              </Tooltip>
            </div>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <Space className="user-info">
                <Avatar size={32} src={user?.avatar} icon={<UserOutlined />} />
                <span>{user?.nickname || 'Admin'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <TabBar />
        <Content className="content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
