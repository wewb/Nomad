import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorFallback } from './components/ErrorBoundary';
import { routes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} errorElement={<ErrorFallback error={new Error('页面加载失败')} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {routes.map(route => (
            <Route 
              key={route.path} 
              path={route.path} 
              element={route.element}
              errorElement={<ErrorFallback error={new Error('页面加载失败')} />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; 