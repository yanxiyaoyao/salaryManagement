import request from '@/request'

export const fetchCategories = (params) => request.get('/categories', { params })

export const createCategory = (payload) => request.post('/categories', payload)

export const updateCategory = (id, payload) => request.put(`/categories/${id}`, payload)

export const deleteCategory = (id) => request.delete(`/categories/${id}`)
