import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { registerAsync, clearError } from '@/store/slices/authSlice'
import './index.scss'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((state) => state.auth)
  const [form] = Form.useForm()

  useEffect(() => {
    if (token) {
      navigate('/admin', { replace: true })
    }
  }, [token, navigate])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致！')
      return
    }

    const { confirmPassword, ...userData } = values
    const result = await dispatch(registerAsync(userData))
    if (registerAsync.fulfilled.match(result)) {
      message.success('注册成功！请登陆')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="card-visual">
          <span className="visual-badge">Expense Tracker</span>
          <h2>创建你的账户</h2>
          <p>快捷注册，开始管理你的个人收支与分类。</p>
        </div>
        <div className="card-form-wrapper">
          <div className="card-header">
            <h3>注册账户</h3>
            <p>填写账号信息以完成注册</p>
          </div>
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
            className="card-form"
            requiredMark={false}
          >
            <Form.Item
              label="账号"
              name="username"
              rules={[
                { required: true, message: '请输入账号!' },
                { min: 3, message: '账号至少3个字符!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入账号"
                allowClear
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
              />
            </Form.Item>

            <Form.Item className="form-submit">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                立即注册
              </Button>
            </Form.Item>
          </Form>

          <div className="card-footer">
            <span>已有账号？</span>
            <Link to="/login">返回登录</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

