import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ward: null,
  category: null,
  status: null,
  q: '',
  sort: 'recent',
  page: 1,
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state[key] = value;
      if (key !== 'page') {
        state.page = 1;
      }
    },
    resetFilters: () => initialState,
  },
});

export const { setFilter, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
