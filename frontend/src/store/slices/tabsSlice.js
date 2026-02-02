import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tabs: [], // 存储标签页列表
  activeKey: '', // 当前活跃的标签页
}

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    // 添加标签页
    addTab: (state, action) => {
      const { path, label } = action.payload
      const existingTab = state.tabs.find((tab) => tab.path === path)

      if (!existingTab) {
        // 如果标签页不存在，添加新标签页（最多10个）
        if (state.tabs.length < 10) {
          state.tabs.push({ path, label })
        }
      }

      state.activeKey = path
    },

    // 关闭单个标签页
    closeTab: (state, action) => {
      const { path } = action.payload
      const index = state.tabs.findIndex((tab) => tab.path === path)

      if (index > -1) {
        state.tabs.splice(index, 1)

        // 如果关闭的是当前活跃的标签页，切换到其他标签页
        if (state.activeKey === path) {
          if (state.tabs.length > 0) {
            // 优先选择右边的标签页，如果没有则选择左边的
            state.activeKey = state.tabs[Math.min(index, state.tabs.length - 1)].path
          } else {
            state.activeKey = ''
          }
        }
      }
    },

    // 关闭所有标签页
    closeAllTabs: (state) => {
      state.tabs = []
      state.activeKey = ''
    },

    // 关闭其他标签页
    closeOtherTabs: (state, action) => {
      const { path } = action.payload
      const tab = state.tabs.find((tab) => tab.path === path)

      if (tab) {
        state.tabs = [tab]
        state.activeKey = path
      }
    },

    // 设置活跃标签页
    setActiveTab: (state, action) => {
      const { path } = action.payload
      if (state.tabs.find((tab) => tab.path === path)) {
        state.activeKey = path
      }
    },

    // 清空所有标签页
    clearTabs: (state) => {
      state.tabs = []
      state.activeKey = ''
    },
  },
})

export const { addTab, closeTab, closeAllTabs, closeOtherTabs, setActiveTab, clearTabs } =
  tabsSlice.actions

export default tabsSlice.reducer
