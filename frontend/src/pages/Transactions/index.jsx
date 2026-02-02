import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Input,
  InputNumber,
  Button,
  message,
  Popconfirm,
  Modal,
  Form,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  createTransactionAsync,
  deleteTransactionAsync,
  fetchTransactionsAsync,
  updateTransactionAsync,
} from '@/store/slices/transactionsSlice'
import { fetchCategories } from '@/apis/categories'
import './index.scss'

const { RangePicker } = DatePicker

const Transactions = () => {
  const dispatch = useDispatch()
  const { items, loading, page, pageSize, total, error } = useSelector((state) => state.transactions)
  const [form] = Form.useForm()
  const defaultFilters = { type: 'all', categoryId: undefined, dateRange: [] }
  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTx, setEditingTx] = useState(null)

  useEffect(() => {
    fetchCategories({ page: 1, size: 1000 }).then((res) => {
      if (res.code === 200) {
        setCategoryOptions(
          (res.data?.items || []).map((c) => ({
            label: c.name,
            value: c.id,
          })),
        )
      }
    })
  }, [])

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const buildParams = useCallback((baseFilters, nextPage, nextSize) => {
      const params = {
        page: nextPage,
        size: nextSize,
      }
      if (baseFilters.type && baseFilters.type !== 'all') params.type = baseFilters.type
      if (baseFilters.categoryId) params.category_id = baseFilters.categoryId
      if (baseFilters.dateRange?.length === 2) {
        params.start_date = baseFilters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = baseFilters.dateRange[1].format('YYYY-MM-DD')
      }
      return params
    },
    [],
  )

  // 统一的查询函数
  const fetchList = useCallback(
    (targetFilters, targetPage, targetSize) => {
      dispatch(fetchTransactionsAsync(buildParams(targetFilters, targetPage, targetSize)))
    },
    [dispatch, buildParams],
  )

  // 首次加载
  useEffect(() => {
    fetchList(defaultFilters, 1, pageSize)
  }, [fetchList, pageSize])

  const openCreateModal = () => {
    setEditingTx(null)
    form.resetFields()
    setModalVisible(true)
  }

  const openEditModal = (record) => {
    setEditingTx(record)
    form.setFieldsValue({
      type: record.type,
      amount: record.amount,
      occurred_on: record.occurredOn ? dayjs(record.occurredOn) : null,
      category_id: record.category?.id || record.categoryId,
      note: record.note,
    })
    setModalVisible(true)
  }

  const handleSubmit = (values) => {
    const payload = {
      type: values.type,
      amount: values.amount,
      occurred_on: values.occurred_on?.format('YYYY-MM-DD'),
      category_id: values.category_id,
      note: values.note,
    }

    const action = editingTx
      ? updateTransactionAsync({ id: editingTx.id, data: payload })
      : createTransactionAsync(payload)

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(editingTx ? '更新成功' : '创建成功')
        setModalVisible(false)
        setEditingTx(null)
        form.resetFields()
        dispatch(fetchTransactionsAsync(buildParams(editingTx ? page : 1, pageSize)))
      })
      .catch((err) => {
        message.error(err || '操作失败，请重试')
      })
  }

  const handleSearch = () => {
    setAppliedFilters(filters)
    fetchList(filters, 1, pageSize)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    fetchList(defaultFilters, 1, pageSize)
  }

  const handleDelete = (record) =>
    dispatch(deleteTransactionAsync(record.id))
      .unwrap()
      .then(() => {
        message.success('删除成功')
        dispatch(fetchTransactionsAsync(buildParams(page, pageSize)))
      })
      .catch((err) => {
        message.error(err || '删除失败，请重试')
      })

  const columns = [
    {
      title: '日期',
      dataIndex: 'occurredOn',
      key: 'occurredOn',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (value) => (
        <Tag color={value === 'income' ? 'green' : 'volcano'}>
          {value === 'income' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value, record) => {
        const isExpense = record.type === 'expense'
        const cls = isExpense ? 'amount expense' : 'amount income'
        const sign = isExpense ? '-' : '+'
        const display = Math.abs(value).toFixed(2)
        const currencyLabel = record.currency === 'CNY' ? '元' : record.currency
        return (
          <span className={cls}>
            {sign}
            {display} {currencyLabel}
          </span>
        )
      },
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该交易？"
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

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">交易流水</h1>
          <p className="page-subtitle">查看、筛选并管理最近的记账记录</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          记一笔
        </Button>
      </div>

      <Card className="filters-card" bordered={false}>
        <Space size={[12, 12]} wrap>
          <RangePicker
            value={filters.dateRange}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value || [] }))}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            value={filters.type}
            style={{ width: 140 }}
            onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '仅支出', value: 'expense' },
              { label: '仅收入', value: 'income' },
            ]}
          />
          <Select
            style={{ width: 160 }}
            placeholder="选择分类"
            allowClear
            value={filters.categoryId}
            options={categoryOptions}
            onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value }))}
          />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Space>
      </Card>

      <Card bordered={false} className="table-card">
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (p, ps) => fetchList(appliedFilters, p, ps),
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingTx ? '编辑交易' : '新增交易'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingTx(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        destroyOnClose
        okText={editingTx ? '保存' : '创建'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'expense' }}
        >
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              options={[
                { label: '支出', value: 'expense' },
                { label: '收入', value: 'income' },
              ]}
            />
          </Form.Item>

          <Form.Item name="amount" label="金额 (元)" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="occurred_on"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="category_id" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select
              placeholder="选择分类"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="可选" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Transactions
