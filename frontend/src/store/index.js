import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import categoriesReducer from './slices/categoriesSlice'
import transactionsReducer from './slices/transactionsSlice'
import tabsReducer from './slices/tabsSlice'

export default configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    transactions: transactionsReducer,
    tabs: tabsReducer,
  },
})

