import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Applications } from './pages/Applications';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { EventAnalysis } from './pages/EventAnalysis';
import { ErrorFallback } from './components/ErrorBoundary';
import { ApplicationNew } from './pages/ApplicationNew';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorFallback error={new Error('页面加载失败')} />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        index: true,
        element: <Dashboard />,
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
    ],
  },
]);

export default router; 