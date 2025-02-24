import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { EventAnalysis } from './pages/EventAnalysis';
import { Applications } from './pages/Applications';
import { Login } from './pages/Login';
import { PrivateRoute } from './components/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <PrivateRoute><Layout /></PrivateRoute>,
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
        path: 'applications',
        element: <Applications />,
      }
    ],
  },
]);

export default router; 