import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Applications } from './pages/Applications';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { EventAnalysis } from './pages/EventAnalysis';
import { ErrorFallback } from './components/ErrorBoundary';
import { ApplicationNew } from './pages/ApplicationNew';
import { PrivateRoute } from './components/PrivateRoute';
import { UserManagement } from './pages/Settings/UserManagement';
import { ApiSettings } from './pages/Settings/ApiSettings';
import { SystemSettings } from './pages/Settings/SystemSettings';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    errorElement: <ErrorFallback error={new Error('页面加载失败')} />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'applications',
        element: <Applications />,
      },
      {
        path: 'applications/new',
        element: <ApplicationNew />,
      },
      {
        path: 'applications/:id',
        element: <ApplicationDetail />,
      },
      {
        path: 'event-analysis',
        element: <EventAnalysis />,
      },
      {
        path: 'event-analysis/:eventName',
        element: <EventAnalysis />,
      },
      {
        path: 'settings/users',
        element: <UserManagement />,
      },
      {
        path: 'settings/api',
        element: <ApiSettings />,
      },
      {
        path: 'settings/system',
        element: <SystemSettings />,
      },
    ],
  },
]);

export default router; 