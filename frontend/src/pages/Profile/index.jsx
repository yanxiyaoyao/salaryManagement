import { useState, useEffect } from 'react'
import { Card, Avatar, Button, Space, Upload, Form, Input, message, Row, Col, Spin } from 'antd'
import { UserOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, updateUser, updateProfileAsync, uploadAvatarAsync, changePasswordAsync } from '@/store/slices/authSlice'
import './index.scss'

const Profile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const token = useSelector((state) => state.auth.token)
  
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileForm] = Form.useForm()
  const [pwdForm] = Form.useForm()

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
      })
      if (user.avatar) {
        setAvatarUrl(user.avatar)
      }
    }
  }, [user, profileForm])

  const handleProfileSubmit = async (values) => {
    setLoading(true)
    try {
      const result = await dispatch(updateProfileAsync({
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
      }))

      if (updateProfileAsync.fulfilled.match(result)) {
        // 更新 Redux 中的用户信息
        dispatch(updateUser({
          nickname: values.nickname,
          email: values.email,
          phone: values.phone,
        }))
        message.success('个人信息已更新')
      } else {
        message.error(result.payload || '更新失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePwdSubmit = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }

    const result = await dispatch(changePasswordAsync({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    }))

    if (changePasswordAsync.fulfilled.match(result)) {
      message.success('密码修改成功，请重新登录')
      pwdForm.resetFields()
      // 密码修改成功后自动退出登录（Redux 已处理）
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } else {
      message.error(result.payload || '修改失败')
    }
  }

  const handleAvatarUpload = async (file) => {
    const result = await dispatch(uploadAvatarAsync(file))

    if (uploadAvatarAsync.fulfilled.match(result)) {
      setAvatarUrl(result.payload.avatar)
      // 更新 Redux 中的用户头像
      dispatch(updateUser({ avatar: result.payload.avatar }))
      message.success('头像上传成功')
    } else {
      message.error(result.payload || '上传失败')
    }
    return false
  }

  const uploadProps = {
    showUploadList: false,
    beforeUpload: handleAvatarUpload,
  }

  return (
    <Spin spinning={loading}>
      <div className="profile-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">个人中心</h1>
            <p className="page-subtitle">管理头像、资料与密码，保持账户信息最新</p>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card bordered={false} className="profile-section">
              <Space direction="vertical" size={16}>
                <Space size={16}>
                  <Avatar size={96} src={avatarUrl} icon={!avatarUrl ? <UserOutlined /> : undefined} />
                  <div>
                    <p>更换头像。支持 jpg/png/jpeg/gif 格式。</p>
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />} loading={loading}>选择图片</Button>
                    </Upload>
                  </div>
                </Space>
              </Space>
            </Card>
          </Col>

        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="修改资料" bordered={false} className="profile-section">
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileSubmit}
              >
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input placeholder="请输入昵称" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '邮箱格式不正确' },
                  { required: true, message: '请输入邮箱' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item name="phone" label="手机号" rules={[{ pattern: /^\d{0,20}$/, message: '手机号格式不正确' }]}>
                <Input placeholder="选填" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<EditOutlined />} loading={loading}>
                  保存
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="修改密码" bordered={false} className="profile-section">
            <Form form={pwdForm} layout="vertical" onFinish={handlePwdSubmit}>
              <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
                <Input.Password placeholder="至少 6 位" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                rules={[{ required: true, message: '请再次输入新密码' }]}
              >
                <Input.Password placeholder="再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    修改密码
                  </Button>
                  <Button htmlType="button" onClick={() => pwdForm.resetFields()}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
      </div>
    </Spin>
  )
}

export default Profile
