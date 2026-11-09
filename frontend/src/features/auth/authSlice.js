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
      const user = action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
      state.status = 'succeeded';
      if (user?.token) {
        localStorage.setItem('civicfix_token', user.token);
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      localStorage.removeItem('civicfix_token');
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
        const user = action.payload.data || action.payload.user || action.payload;
        state.user = user;
        state.isAuthenticated = true;
        state.status = 'succeeded';
        if (user?.token) {
          localStorage.setItem('civicfix_token', user.token);
        }
      })
      .addMatcher(civicApi.endpoints.register.matchFulfilled, (state, action) => {
        const user = action.payload.data || action.payload.user || action.payload;
        state.user = user;
        state.isAuthenticated = true;
        state.status = 'succeeded';
        if (user?.token) {
          localStorage.setItem('civicfix_token', user.token);
        }
      })
      .addMatcher(civicApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        localStorage.removeItem('civicfix_token');
      });
  },
});

export const { setUser, clearUser, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
