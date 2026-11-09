import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  viewMode: 'list', // 'list' | 'map'
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setViewMode } = uiSlice.actions;
export default uiSlice.reducer;
