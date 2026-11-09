import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'civicfix_report_draft';

function loadInitialState() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore storage parse error
  }
  return {
    step: 1,
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: '',
    },
    description: '',
    categoryId: null,
    imagePreview: null,
    aiSuggestion: null,
    joinIssueId: null,
  };
}

export const reportDraftSlice = createSlice({
  name: 'reportDraft',
  initialState: loadInitialState(),
  reducers: {
    setDraftField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage write error
      }
    },
    resetDraft: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage error
      }
      return {
        step: 1,
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: '',
        },
        description: '',
        categoryId: null,
        imagePreview: null,
        aiSuggestion: null,
        joinIssueId: null,
      };
    },
  },
});

export const { setDraftField, resetDraft } = reportDraftSlice.actions;
export default reportDraftSlice.reducer;
