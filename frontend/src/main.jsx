import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="245061178459-v1uinorlh9ntq5nbo6mih4uj8s3tu8gt.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
