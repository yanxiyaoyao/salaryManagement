import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchCategories as fetchCategoriesApi,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
} from '@/apis/categories'

const toViewModel = (item = {}) => ({
  id: item.id,
  name: item.name,
  type: item.type,
  color: item.color,
  createdAt: item.created_at || item.createdAt,
  updatedAt: item.updated_at || item.updatedAt,
})

export const fetchCategoriesAsync = createAsyncThunk(
  'categories/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await fetchCategoriesApi(params)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '加载分类失败')
      }
      return {
        items: (res.data?.items || []).map(toViewModel),
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 1,
        size: res.data?.size ?? params?.size ?? 10,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '加载分类失败')
    }
  },
)

export const createCategoryAsync = createAsyncThunk(
  'categories/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createCategoryApi(payload)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '新增分类失败')
      }
      return toViewModel(res.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '新增分类失败')
    }
  },
)

export const updateCategoryAsync = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateCategoryApi(id, data)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '更新分类失败')
      }
      return toViewModel(res.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '更新分类失败')
    }
  },
)

export const deleteCategoryAsync = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteCategoryApi(id)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '删除分类失败')
      }
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '删除分类失败')
    }
  },
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
    total: 0,
    page: 1,
    size: 10,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategoriesAsync.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.size = action.payload.size
      })
      .addCase(fetchCategoriesAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      .addCase(createCategoryAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items.push(action.payload)
      })
      .addCase(createCategoryAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
      .addCase(updateCategoryAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        )
      })
      .addCase(updateCategoryAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
      .addCase(deleteCategoryAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(deleteCategoryAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
      .addCase(deleteCategoryAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
  },
})

export default categoriesSlice.reducer
