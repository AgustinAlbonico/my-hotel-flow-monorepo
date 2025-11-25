/**
 * Error Boundary - Captura de errores en React
 * Siguiendo MEJORES_PRACTICAS.md - Manejo de errores
 */
import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log del error a un servicio de monitoreo (ej: Sentry)
    // eslint-disable-next-line no-console
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({ error, errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-error-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-error-600" size={48} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Ups! Algo salió mal
            </h1>
            <p className="text-gray-600 mb-8">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página o
              vuelve al inicio.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-error-600">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={this.handleReload} className="btn-secondary">
                Recargar Página
              </button>
              <button onClick={this.handleGoHome} className="btn-primary">
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
