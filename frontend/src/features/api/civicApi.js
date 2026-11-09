import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';

export const civicApi = createApi({
  reducerPath: 'civicApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
  }),
  tagTypes: [
    'Me',
    'Meta',
    'Issue',
    'IssueList',
    'Timeline',
    'MyReports',
    'Notification',
    'WardQueue',
    'Analytics',
    'Moderation',
  ],
  endpoints: (builder) => ({
    // Meta & Public
    getHealth: builder.query({
      query: () => '/health',
    }),
    getMeta: builder.query({
      query: () => '/meta',
      providesTags: ['Meta'],
    }),
    getPublicStats: builder.query({
      query: () => '/public/stats',
      providesTags: ['Analytics'],
    }),

    // Auth & Profile
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Me'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/users/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Me'],
    }),

    // Issues
    getIssues: builder.query({
      query: (params) => ({
        url: '/issues',
        params,
      }),
      providesTags: ['IssueList'],
    }),
    getNearbyIssues: builder.query({
      query: (params) => ({
        url: '/issues/nearby',
        params,
      }),
      providesTags: ['IssueList'],
    }),
    getIssueById: builder.query({
      query: (id) => `/issues/${id}`,
      providesTags: (result, error, id) => [{ type: 'Issue', id }],
    }),
    getIssueTimeline: builder.query({
      query: (id) => `/issues/${id}/timeline`,
      providesTags: (result, error, id) => [{ type: 'Timeline', id }],
    }),
    supportIssue: builder.mutation({
      query: (id) => ({
        url: `/issues/${id}/support`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'IssueList',
        'Notification',
      ],
    }),
    withdrawSupport: builder.mutation({
      query: (id) => ({
        url: `/issues/${id}/support`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'IssueList',
        'Notification',
      ],
    }),
    verifyIssue: builder.mutation({
      query: ({ id, rating, comment }) => ({
        url: `/issues/${id}/verify`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'IssueList',
        'MyReports',
        'Notification',
        'WardQueue',
        'Analytics',
      ],
    }),
    reopenIssue: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/issues/${id}/reopen`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'IssueList',
        'MyReports',
        'Notification',
        'WardQueue',
        'Analytics',
      ],
    }),

    // Reports
    precheckReport: builder.mutation({
      query: (body) => ({
        url: '/reports/precheck',
        method: 'POST',
        body,
      }),
    }),
    submitReport: builder.mutation({
      query: (formData) => ({
        url: '/reports',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['IssueList', 'MyReports', 'Analytics', 'WardQueue'],
    }),
    getMyReports: builder.query({
      query: () => '/reports/my',
      providesTags: ['MyReports'],
    }),

    // Notifications
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Ward Console
    getWardQueue: builder.query({
      query: (params) => ({
        url: '/ward/issues',
        params,
      }),
      providesTags: ['WardQueue'],
    }),
    getWardIssue: builder.query({
      query: (id) => `/ward/issues/${id}`,
      providesTags: (result, error, id) => [{ type: 'Issue', id }],
    }),
    assignIssue: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ward/issues/${id}/assign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'WardQueue',
        'Analytics',
        'Notification',
      ],
    }),
    updateWardStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ward/issues/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
        'WardQueue',
        'Analytics',
        'Notification',
      ],
    }),
    postWardUpdate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ward/issues/${id}/updates`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
      ],
    }),
    uploadWardEvidence: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/ward/issues/${id}/evidence`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Issue', id },
        { type: 'Timeline', id },
      ],
    }),
    regenerateAiSummary: builder.mutation({
      query: (id) => ({
        url: `/ward/issues/${id}/ai-summary`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Issue', id }],
    }),
    getWardTeam: builder.query({
      query: (params) => ({
        url: '/ward/team',
        params,
      }),
    }),
    getModerationQueue: builder.query({
      query: () => '/ward/moderation',
      providesTags: ['Moderation'],
    }),
    moderateIssue: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ward/issues/${id}/moderate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Moderation', 'WardQueue', 'IssueList'],
    }),

    // Ward Analytics
    getAnalyticsOverview: builder.query({
      query: () => '/ward/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getAnalyticsCategories: builder.query({
      query: () => '/ward/analytics/categories',
      providesTags: ['Analytics'],
    }),
    getAnalyticsTimeseries: builder.query({
      query: (days = 30) => `/ward/analytics/timeseries?days=${days}`,
      providesTags: ['Analytics'],
    }),
    getAnalyticsScorecard: builder.query({
      query: () => '/ward/analytics/scorecard',
      providesTags: ['Analytics'],
    }),
    getAnalyticsHotspots: builder.query({
      query: () => '/ward/analytics/hotspots',
      providesTags: ['Analytics'],
    }),
    getAnalyticsAgeing: builder.query({
      query: () => '/ward/analytics/ageing',
      providesTags: ['Analytics'],
    }),
    getAnalyticsWards: builder.query({
      query: () => '/ward/analytics/wards',
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMetaQuery,
  useGetPublicStatsQuery,
  useGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useGetIssuesQuery,
  useGetNearbyIssuesQuery,
  useGetIssueByIdQuery,
  useGetIssueTimelineQuery,
  useSupportIssueMutation,
  useWithdrawSupportMutation,
  useVerifyIssueMutation,
  useReopenIssueMutation,
  usePrecheckReportMutation,
  useSubmitReportMutation,
  useGetMyReportsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetWardQueueQuery,
  useGetWardIssueQuery,
  useAssignIssueMutation,
  useUpdateWardStatusMutation,
  usePostWardUpdateMutation,
  useUploadWardEvidenceMutation,
  useRegenerateAiSummaryMutation,
  useGetWardTeamQuery,
  useGetModerationQueueQuery,
  useModerateIssueMutation,
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsCategoriesQuery,
  useGetAnalyticsTimeseriesQuery,
  useGetAnalyticsScorecardQuery,
  useGetAnalyticsHotspotsQuery,
  useGetAnalyticsAgeingQuery,
  useGetAnalyticsWardsQuery,
} = civicApi;
