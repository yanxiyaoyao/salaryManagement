import request from '@/request'

// 获取用户个人信息
export const getProfile = () => request.get('/users/profile')

// 更新用户个人信息
export const updateProfile = (data) => request.put('/users/profile', data)

// 上传用户头像
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 修改用户密码
export const changePassword = (data) => request.put('/users/password', data)
