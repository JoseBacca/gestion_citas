import React, { StrictMode } from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Authprovider } from './providers/Authproviders';
import { ThemeProvider } from './providers/ThemeContext';
import { NotificationProvider } from './providers/NotificationContext';
import App from './App';
import "./shared/Styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Authprovider>
          <NotificationProvider>
            <App/>
            <Toaster position='top-right' richColors/>
          </NotificationProvider>
        </Authprovider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
