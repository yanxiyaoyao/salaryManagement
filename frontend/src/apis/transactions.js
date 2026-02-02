import request from '@/request'

export const fetchTransactions = (params) => request.get('/transactions', { params })

export const createTransaction = (payload) => request.post('/transactions', payload)

export const updateTransaction = (id, payload) => request.put(`/transactions/${id}`, payload)

export const deleteTransaction = (id) => request.delete(`/transactions/${id}`)
