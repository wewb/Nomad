import React from 'react';
import { AppIcon, DashboardIcon, ChartIcon } from 'tdesign-icons-react';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { EventAnalysis } from './pages/EventAnalysis';
import { Applications } from './pages/Applications';

export const routes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    name: '仪表盘',
    icon: <DashboardIcon />,
  },
  {
    path: '/events',
    element: <Events />,
    name: '事件列表',
    icon: <ChartIcon />,
  },
  {
    path: '/event-analysis',
    element: <EventAnalysis />,
    name: '事件分析',
    icon: <ChartIcon />,
  },
  {
    path: '/applications',
    element: <Applications />,
    name: '应用管理',
    icon: <AppIcon />,
  },
  // ... 其他路由
]; 