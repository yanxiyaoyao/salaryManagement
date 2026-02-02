import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { loginAsync, clearError } from '@/store/slices/authSlice'
import './index.scss'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((state) => state.auth)
  const [form] = Form.useForm()

  useEffect(() => {
    document.body.classList.add('login-no-scroll')
    return () => {
      document.body.classList.remove('login-no-scroll')
    }
  }, [])

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    const savedPassword = localStorage.getItem('rememberedPassword')
    if (savedUsername || savedPassword) {
      form.setFieldsValue({
        username: savedUsername || '',
        password: savedPassword || '',
        remember: true,
      })
    }
  }, [form])

  useEffect(() => {
    // 如果已登录，跳转到后台
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
    const { remember, ...credentials } = values
    const result = await dispatch(loginAsync(credentials))
    if (loginAsync.fulfilled.match(result)) {
      message.success('登录成功！')
      if (remember) {
        localStorage.setItem('rememberedUsername', credentials.username || '')
        localStorage.setItem('rememberedPassword', credentials.password || '')
      } else {
        localStorage.removeItem('rememberedUsername')
        localStorage.removeItem('rememberedPassword')
      }
      navigate('/admin')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-visual">
          <span className="visual-badge">Expense Tracker</span>
          <h2>个人开支记账管理系统</h2>
          <p>轻量、安全，随时随地记录与管理个人收支。</p>
        </div>
        <div className="card-form-wrapper">
          <div className="card-header">
            <h3>账号登录</h3>
            <p>请输入账号密码登录</p>
          </div>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
            className="card-form"
            initialValues={{ remember: true }}
            requiredMark={false}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 3, message: '用户名至少3个字符!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
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

            <div className="form-extras">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住密码</Checkbox>
              </Form.Item>
              <Link className="forgot-password" to="/forgot-password">
                忘记密码？
              </Link>
            </div>

            <Form.Item className="form-submit">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="card-footer">
            <span>还没有账号？</span>
            <Link to="/register">立即注册</Link>
          </div>
          <footer className="login-footer">© 2025 React Admin. All rights reserved.</footer>
        </div>
      </div>
    </div>
  )
}

export default Login

