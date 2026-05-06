import React, { StrictMode } from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Authprovider } from './providers/Authproviders';
import App from './App';
import "./shared/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Authprovider>
        <App/>
        <Toaster position='top-right' richColors/>
      </Authprovider>
    </BrowserRouter>
  </React.StrictMode>
);