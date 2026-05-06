import { Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { ProjectMembersPage } from './pages/ProjectMembersPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { TaskPage } from './pages/TaskPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppShell } from './layout/AppShell';
import { ProjectShell } from './layout/ProjectShell';
import { RequireAuth } from './auth/RequireAuth';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectShell />}>
          <Route index element={<ProjectOverviewPage />} />
          <Route path="board" element={<ProjectBoardPage />} />
          <Route path="members" element={<ProjectMembersPage />} />
          <Route path="settings" element={<ProjectSettingsPage />} />
          <Route path="tasks/:taskId" element={<TaskPage />} />
        </Route>
      </Route>

      <Route path="/app" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
