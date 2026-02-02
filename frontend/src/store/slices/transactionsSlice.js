import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchTransactions as fetchTransactionsApi,
  createTransaction as createTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '@/apis/transactions'

const toViewModel = (item = {}) => ({
  id: Number(item.id),
  key: Number(item.id),
  occurredOn: item.occurred_on,
  type: item.type,
  category: item.category?.name,
  categoryId: item.category?.id,
  amount: Number(item.amount),
  currency: item.currency || 'CNY',
  note: item.note,
})

export const fetchTransactionsAsync = createAsyncThunk(
  'transactions/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchTransactionsApi(params)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '加载交易记录失败')
      }
      return {
        items: (res.data?.items || []).map(toViewModel),
        page: res.data?.page || params.page || 1,
        pageSize: res.data?.size || params.size || 10,
        total: res.data?.total || 0,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '加载交易记录失败')
    }
  },
)

export const createTransactionAsync = createAsyncThunk(
  'transactions/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createTransactionApi(payload)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '新增交易失败')
      }
      return toViewModel(res.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '新增交易失败')
    }
  },
)

export const updateTransactionAsync = createAsyncThunk(
  'transactions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateTransactionApi(id, data)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '更新交易失败')
      }
      return toViewModel(res.data)
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '更新交易失败')
    }
  },
)

export const deleteTransactionAsync = createAsyncThunk(
  'transactions/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteTransactionApi(id)
      if (res.code !== 200) {
        return rejectWithValue(res.msg || '删除交易失败')
      }
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || '删除交易失败')
    }
  },
)

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.total = action.payload.total
      })
      .addCase(fetchTransactionsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      .addCase(createTransactionAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createTransactionAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items = [action.payload, ...state.items]
        state.total += 1
      })
      .addCase(createTransactionAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
      .addCase(updateTransactionAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateTransactionAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        )
      })
      .addCase(updateTransactionAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
      .addCase(deleteTransactionAsync.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(deleteTransactionAsync.fulfilled, (state, action) => {
        state.saving = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.total = Math.max(state.total - 1, 0)
      })
      .addCase(deleteTransactionAsync.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload || action.error.message
      })
  },
})

export default transactionsSlice.reducer
