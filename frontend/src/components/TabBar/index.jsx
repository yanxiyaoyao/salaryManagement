import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { closeTab, closeAllTabs, closeOtherTabs, setActiveTab } from '@/store/slices/tabsSlice'
import { CloseOutlined,  DownOutlined } from '@ant-design/icons'
import { Dropdown, Button } from 'antd'
import './index.scss'

const TabBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { tabs, activeKey } = useSelector((state) => state.tabs)

  if (tabs.length === 0) {
    return null
  }

  const handleTabClick = (path) => {
    dispatch(setActiveTab({ path }))
    navigate(path)
  }

  const handleCloseTab = (e, path) => {
    e.stopPropagation()
    dispatch(closeTab({ path }))
  }

  const getContextMenuItems = (path) => [
    {
      key: 'close',
      label: '关闭',
      icon: <CloseOutlined />,
      onClick: () => {
        dispatch(closeTab({ path }))
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'closeOther',
      label: '关闭其他',
      onClick: () => {
        dispatch(closeOtherTabs({ path }))
      },
    },
    {
      key: 'closeAll',
      label: '关闭所有',
      onClick: () => {
        dispatch(closeAllTabs())
      },
    },
  ]

  const actionMenuItems = [
    {
      key: 'closeOther',
      label: '关闭其他',
      onClick: () => {
        dispatch(closeOtherTabs({ path: activeKey }))
      },
    },
    {
      key: 'closeAll',
      label: '关闭所有',
      onClick: () => {
        dispatch(closeAllTabs())
      },
    },
  ]

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <Dropdown
            key={tab.path}
            menu={{ items: getContextMenuItems(tab.path) }}
            trigger={['contextMenu']}
          >
            <div
              className={`tab-item ${activeKey === tab.path ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.path)}
              title={tab.label}
            >
              <span className="tab-label">{tab.label}</span>
              <CloseOutlined
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.path)}
              />
            </div>
          </Dropdown>
        ))}
      </div>

      {tabs.length > 0 && (
        <div className="tab-actions">
          <Dropdown
            menu={{ items: actionMenuItems }}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              className="action-dropdown-btn"
            >
              <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      )}
    </div>
  )
}

export default TabBar
