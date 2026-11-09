import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store } from './app/store';
import { useGetMeQuery } from './features/api/civicApi';
import { RequireAuth, RequireRole, GuestOnly } from './app/guards';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CitizenLayout from './layouts/CitizenLayout';
import WardConsoleLayout from './layouts/WardConsoleLayout';

// Pages
import LandingPage from './pages/LandingPage';
import FeedPage from './pages/FeedPage';
import IssueDetailPage from './pages/IssueDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import CitizenDashboardPage from './pages/citizen/CitizenDashboardPage';
import ReportFlowPage from './pages/citizen/ReportFlowPage';
import MyReportsPage from './pages/citizen/MyReportsPage';
import NotificationsPage from './pages/citizen/NotificationsPage';
import ProfilePage from './pages/citizen/ProfilePage';

import WardQueuePage from './pages/ward/WardQueuePage';
import WardWorkspacePage from './pages/ward/WardWorkspacePage';
import WardModerationPage from './pages/ward/WardModerationPage';
import WardAnalyticsPage from './pages/ward/WardAnalyticsPage';

import NotFoundPage from './pages/NotFoundPage';

// AppInitializer validates session from cookie on initial load
function AppInitializer({ children }) {
  useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC & GUEST ROUTES */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/issues" element={<Navigate to="/feed" replace />} />
              <Route path="/issues/:id" element={<IssueDetailPage />} />

              {/* Guest Only: Login / Register */}
              <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>

            {/* CITIZEN PORTAL (Protected) */}
            <Route element={<RequireAuth />}>
              <Route element={<CitizenLayout />}>
                <Route path="/citizen/dashboard" element={<CitizenDashboardPage />} />
                <Route path="/app" element={<Navigate to="/citizen/dashboard" replace />} />
                <Route path="/citizen/report" element={<ReportFlowPage />} />
                <Route path="/citizen/reports" element={<MyReportsPage />} />
                <Route path="/citizen/notifications" element={<NotificationsPage />} />
                <Route path="/citizen/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* WARD CONSOLE (Officers / Workers / Admin) */}
            <Route element={<RequireRole roles={['ward_admin', 'worker', 'admin', 'moderator']} />}>
              <Route element={<WardConsoleLayout />}>
                <Route path="/ward" element={<Navigate to="/ward/queue" replace />} />
                <Route path="/ward/queue" element={<WardQueuePage />} />
                <Route path="/ward/issues/:id" element={<WardWorkspacePage />} />
                <Route path="/ward/moderation" element={<WardModerationPage />} />
                <Route path="/ward/analytics" element={<WardAnalyticsPage />} />
              </Route>
            </Route>

            {/* 404 FALLBACK */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AppInitializer>
    </Provider>
  );
}
