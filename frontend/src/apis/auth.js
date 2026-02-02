import request from '@/request'

export const login = (credentials) => request.post('auth/login', credentials)

export const register = (userData) => request.post('auth/register', userData)

