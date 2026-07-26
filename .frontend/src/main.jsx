// React entry point — mounts the entire app into the DOM
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

// Provider nesting order matters:
// BrowserRouter must be outermost so routing hooks work everywhere below it.
// ThemeProvider wraps AuthProvider so theme is available for any auth-themed UI (e.g. login page).
// AuthProvider wraps App so every page/component can access teacher state and login/logout.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
