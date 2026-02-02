import request from '@/request'

export const fetchSummaryStats = (params) => request.get('/statistics/summary', { params })

export const fetchMonthlyStats = (params) => request.get('/statistics/monthly', { params })

export const fetchCategoryPie = (params) => request.get('/statistics/category-pie', { params })

export const fetchAnnualStats = (params) => request.get('/statistics/annual', { params })

export const fetchTrendStats = (params) => request.get('/statistics/trend', { params })

