import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { login, register } from '@/apis/auth'
import { updateProfile, uploadAvatar, changePassword } from '@/apis/user'

// 从localStorage获取初始状态，防止无效 JSON 触发错误
const getInitialAuthState = () => {
  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')

  let user = null
  if (rawUser && rawUser !== 'undefined') {
    try {
      user = JSON.parse(rawUser)
    } catch (err) {
      console.warn('Failed to parse user from localStorage, clearing it.', err)
      localStorage.removeItem('user')
    }
  }

  return {
    token: token || null,
    user,
    loading: false,
    error: null,
  }
}

// 登录异步thunk
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '登录失败')
    }
  }
)

// 注册异步thunk
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await register(userData)
      // 注册成功后不保存 token 和 user，用户需要手动登陆
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '注册失败')
    }
  }
)

// 更新用户个人信息异步thunk
export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateProfile(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '更新失败')
    }
  }
)

// 上传用户头像异步thunk
export const uploadAvatarAsync = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const response = await uploadAvatar(file)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '上传失败')
    }
  }
)

// 修改用户密码异步thunk
export const changePasswordAsync = createAsyncThunk(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await changePassword(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '修改失败')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    logout: (state) => {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // 注册
      .addCase(registerAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerAsync.fulfilled, (state) => {
        state.loading = false
        // 注册成功但不设置 token 和 user，用户需要登陆
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // 更新个人信息
      .addCase(updateProfileAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfileAsync.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateProfileAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // 上传头像
      .addCase(uploadAvatarAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadAvatarAsync.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(uploadAvatarAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // 修改密码
      .addCase(changePasswordAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changePasswordAsync.fulfilled, (state) => {
        state.loading = false
        // 密码修改成功后清除用户信息，需要重新登陆
        state.token = null
        state.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, clearError, updateUser } = authSlice.actions
export default authSlice.reducer

