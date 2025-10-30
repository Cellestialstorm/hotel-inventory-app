import React from 'react';
import ReactDOM from 'react-dom/client';// Import BrowserRouter
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import './index.css'; // Your global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
  </React.StrictMode>,
);