import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import QuizLibraryPage from './pages/quizzes/QuizLibraryPage';
import QuizEditorPage from './pages/quizzes/QuizEditorPage';
import QuizPreviewPage from './pages/quizzes/QuizPreviewPage';
import HostLobbyPage from './pages/host/HostLobbyPage';
import HostLivePage from './pages/host/HostLivePage';
import PodiumPage from './pages/host/PodiumPage';
import JoinGamePage from './pages/game/JoinGamePage';
import PlayerGamePage from './pages/game/PlayerGamePage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Player Portal (Mobile-optimized full screen) */}
            <Route path="/join" element={<JoinGamePage />} />
            <Route path="/play" element={<PlayerGamePage />} />

            {/* Host Big-screen Live Session (Full screen) */}
            <Route path="/host/:quizId" element={<HostLobbyPage />} />
            <Route path="/host/live/:quizId" element={<HostLivePage />} />
            <Route path="/host/podium" element={<PodiumPage />} />

            {/* Dashboard & Quiz Management (With App Layout Navbar) */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/quizzes" element={<QuizLibraryPage />} />
              <Route path="/quizzes/new" element={<QuizEditorPage />} />
              <Route path="/quizzes/:quizId/edit" element={<QuizEditorPage />} />
              <Route path="/quizzes/:quizId/preview" element={<QuizPreviewPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:sessionId" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}
