
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'; // Import i18n configuration
import { patchTaskModel } from './hooks/useTaskTypeSetter'; // Import the patch

// Apply the task model patch before mounting the app
// This will ensure all Task objects have a taskType property
patchTaskModel();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
