/**
 * Componente raíz de la aplicación
 * Patrón: Provider Pattern - Orquesta providers de contexto
 * Siguiendo MEJORES_PRACTICAS.md - Arquitectura limpia
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes';

function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <PermissionsProvider>
              <AppRoutes />
            </PermissionsProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
