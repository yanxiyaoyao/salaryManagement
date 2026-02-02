import { useState } from 'react'
import { Table, Button, Space, Input, Popconfirm, message } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import './index.scss'

const Users = () => {
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.username.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <span className={`role-tag role-${role}`}>
          {role === 'admin' ? '管理员' : role === 'user' ? '用户' : '访客'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={status === 'active' ? 'status-active' : 'status-inactive'}>
          {status === 'active' ? '● 活跃' : '● 禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const [data, setData] = useState([
    {
      key: '1',
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01 10:00:00',
    },
    {
      key: '2',
      id: 2,
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-02 10:00:00',
    },
    {
      key: '3',
      id: 3,
      username: 'user2',
      email: 'user2@example.com',
      role: 'user',
      status: 'inactive',
      createdAt: '2024-01-03 10:00:00',
    },
  ])

  const handleEdit = (record) => {
    message.info(`编辑用户: ${record.username}`)
  }

  const handleDelete = (id) => {
    setData(data.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
        <Space>
          <Input
            placeholder="搜索用户名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary">添加用户</Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          total: data.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  )
}

export default Users

