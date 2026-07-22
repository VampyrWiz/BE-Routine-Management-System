/** Application entry point – mounts the React tree with antd ConfigProvider. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.jsx'

/** Suppress antd React 19 compatibility warning in the browser. */
if (typeof window !== 'undefined') {
  window.__ANTD_REACT_COMPAT__ = true;
}

/** Mount the React tree with antd ConfigProvider and StrictMode. */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          // Optional: customize antd theme
        },
      }}
      // Suppress warnings
      warning={{
        strict: false,
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
