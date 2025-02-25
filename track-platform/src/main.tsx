import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'tdesign-react'
import router from './router'
import 'tdesign-react/es/style/index.css'
import './styles/global.less'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider globalConfig={{ classPrefix: 't' }}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
) 