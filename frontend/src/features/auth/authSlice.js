import { createSlice } from '@reduxjs/toolkit';
import { civicApi } from '../api/civicApi';

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.status = 'succeeded';
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.status = 'succeeded';
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(civicApi.endpoints.getMe.matchFulfilled, (state, action) => {
        state.user = action.payload.data || action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.status = 'succeeded';
      })
      .addMatcher(civicApi.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'failed';
      })
      .addMatcher(civicApi.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.data || action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.status = 'succeeded';
      })
      .addMatcher(civicApi.endpoints.register.matchFulfilled, (state, action) => {
        state.user = action.payload.data || action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.status = 'succeeded';
      })
      .addMatcher(civicApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      });
  },
});

export const { setUser, clearUser, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
