import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Table, Button, Tag, Space, Input, Modal, Form, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  fetchCategoriesAsync,
  createCategoryAsync,
  updateCategoryAsync,
  deleteCategoryAsync,
} from '@/store/slices/categoriesSlice'
import './index.scss'

const CATEGORY_TYPES = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
  {label:'保险',value: 'insurance'},
]

const Categories = () => {
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [filters, setFilters] = useState({ kw: '', type: 'all' })
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const dispatch = useDispatch()
  const { items, loading, saving, error, total } = useSelector((state) => state.categories)
  const selectedColor = Form.useWatch('color', form) || '#FF9F1C'

  const buildParams = useCallback(
    (page = pagination.current, size = pagination.pageSize) => ({
      page,
      size,
      ...(filters.kw ? { kw: filters.kw } : {}),
      ...(filters.type && filters.type !== 'all' ? { type: filters.type } : {}),
    }),
    [filters, pagination],
  )

  useEffect(() => {
    dispatch(fetchCategoriesAsync(buildParams()))
  }, [dispatch, buildParams])

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const handleSubmit = (values) => {
    const payload = {
      name: values.name,
      type: values.type,
      color: values.color,
    }

    const action = editingCategory
      ? updateCategoryAsync({ id: editingCategory.id, data: payload })
      : createCategoryAsync(payload)

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(editingCategory ? '分类已更新' : '分类已创建')
        dispatch(fetchCategoriesAsync(buildParams(1, pagination.pageSize)))
        setModalVisible(false)
        setEditingCategory(null)
        form.resetFields()
      })
      .catch((err) => {
        message.error(err || '操作失败，请重试')
      })
  }

  const handleEdit = (record) => {
    setEditingCategory(record)
    setModalVisible(true)
    form.setFieldsValue(record)
  }

  const handleDelete = (record) =>
    dispatch(deleteCategoryAsync(record.key))
      .unwrap()
      .then(() => {
        message.success('分类已删除')
        dispatch(fetchCategoriesAsync(buildParams()))
      })
      .catch((err) => {
        message.error(err || '删除失败，请重试')
      })

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={type === 'income' ? 'green' : 'volcano'}>{type === 'income' ? '收入' : '支出'}</Tag>,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <span className="color-swatch" style={{ backgroundColor: color }} />
      ),
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
      width: 170,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该分类？"
            description={`删除后无法恢复：${record.name}`}
            okText="删除"
            cancelText="取消"
            okType="danger"
            placement="topRight"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSearch = () => {
    const values = filterForm.getFieldsValue()
    setFilters({
      kw: values.keyword || '',
      type: values.type || 'all',
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleReset = () => {
    filterForm.resetFields()
    setFilters({ kw: '', type: 'all' })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">分类管理</h1>
          <p className="page-subtitle">维护支出与收入分类，方便快速记账</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建分类
        </Button>
      </div>

      <Card bordered={false} className="table-card">
        <div className="table-toolbar">
          <Form
            form={filterForm}
            layout="inline"
            onFinish={handleSearch}
            initialValues={{ type: 'all' }}
            style={{ width: '100%', justifyContent: 'flex-start', gap: 12 }}
          >
            <Form.Item name="keyword">
              <Input
                placeholder="分类名称"
                allowClear
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
              />
            </Form.Item>
            <Form.Item name="type">
              <Select
                placeholder="选择类型"
                style={{ width: 160 }}
                allowClear
                options={[
                  { label: '全部类型', value: 'all' },
                  { label: '支出', value: 'expense' },
                  { label: '收入', value: 'income' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  查询
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
        <Table
          columns={columns}
          dataSource={items.map((item) => ({ ...item, key: item.id }))}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize })
              dispatch(fetchCategoriesAsync(buildParams(page, pageSize)))
            },
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="key"
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新建分类'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingCategory(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText={editingCategory ? '保存' : '创建'}
        confirmLoading={saving}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'expense', color: '#FF9F1C' }}
        >
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}> 
            <Input placeholder="如：餐饮" />
          </Form.Item>

          <Form.Item name="type" label="分类类型" rules={[{ required: true, message: '请选择分类类型' }]}> 
            <Select options={CATEGORY_TYPES} placeholder="选择类型" />
          </Form.Item>

          <Form.Item
            name="color"
            label="分类颜色"
            rules={[{ required: true, message: '请选择颜色' }]}
          >
            <div className="color-picker">
              <Input type="color" value={selectedColor} onChange={(e) => form.setFieldValue('color', e.target.value)} />
              <span className="color-swatch" style={{ backgroundColor: selectedColor }} />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Categories
