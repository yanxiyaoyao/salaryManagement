import { useState, useEffect } from 'react'
import { Card, Form, Switch, Button, message, Select } from 'antd'
import './index.scss'

const Settings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      form.setFieldsValue(JSON.parse(savedSettings))
    } else {
      form.setFieldsValue({
        currency: 'CNY',
        theme: 'light',
        startOfWeek: 1,
        notifications: true,
        autoSave: true,
      })
    }
  }, [form])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      // 模拟保存延迟
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // 保存到 localStorage
      localStorage.setItem('appSettings', JSON.stringify(values))
      message.success('设置保存成功！')
    } catch (error) {
      message.error('保存失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">系统设置</h1>

      <Card title="显示设置" className="setting-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="默认币种"
            name="currency"
            rules={[{ required: true, message: '请选择默认币种' }]}
          >
            <Select
              options={[
                { label: '人民币 (CNY)', value: 'CNY' },
                { label: '美元 (USD)', value: 'USD' },
                { label: '欧元 (EUR)', value: 'EUR' },
                { label: '日元 (JPY)', value: 'JPY' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="主题"
            name="theme"
            rules={[{ required: true, message: '请选择主题' }]}
          >
            <Select
              options={[
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
                { label: '自动', value: 'auto' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="一周起始日"
            name="startOfWeek"
            rules={[{ required: true, message: '请选择一周起始日' }]}
          >
            <Select
              options={[
                { label: '周一', value: 1 },
                { label: '周日', value: 7 },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="功能设置" className="setting-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="启用通知"
            name="notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="自动保存"
            name="autoSave"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Settings

