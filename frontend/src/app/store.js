import { configureStore } from '@reduxjs/toolkit';
import { civicApi } from '../features/api/civicApi';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import reportDraftReducer from '../features/report/reportDraftSlice';
import filtersReducer from '../features/issues/filtersSlice';

export const store = configureStore({
  reducer: {
    [civicApi.reducerPath]: civicApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    reportDraft: reportDraftReducer,
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(civicApi.middleware),
});
