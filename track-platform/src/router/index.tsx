import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Dashboard } from '../pages/Dashboard';
import { EventAnalysis } from '../pages/EventAnalysis';
import { Events } from '../pages/Events';

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
        path: 'events',
        element: <Events />,
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