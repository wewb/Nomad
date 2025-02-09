import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Dashboard } from '../pages/Dashboard';
import { EventAnalysis } from '../pages/EventAnalysis';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'event-analysis',
        element: <EventAnalysis />,
      },
    ],
  },
]);

export default router; 