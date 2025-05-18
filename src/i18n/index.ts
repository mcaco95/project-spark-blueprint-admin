
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const enResources = {
  common: {
    welcome: 'Welcome to Project Management App',
    dashboard: 'Dashboard',
    projects: 'Projects',
    tasks: 'Tasks',
    settings: 'Settings',
    admin: 'Admin',
  },
};

// Spanish translations
const esResources = {
  common: {
    welcome: 'Bienvenido a la App de Gestión de Proyectos',
    dashboard: 'Panel de Control',
    projects: 'Proyectos',
    tasks: 'Tareas',
    settings: 'Ajustes',
    admin: 'Administrador',
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: enResources,
      es: esResources,
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
