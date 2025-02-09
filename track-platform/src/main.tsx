import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { ConfigProvider } from 'tdesign-react'
import 'tdesign-react/es/style/index.css'
import './styles/global.less'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider globalConfig={{ classPrefix: 't' }}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
) 