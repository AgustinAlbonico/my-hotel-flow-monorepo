/**
 * Account Statement Page
 * Página para ver el estado de cuenta de un cliente
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccountStatement } from '../hooks/useAccountMovements';
import { AccountMovementCard } from '../components/account/AccountMovementCard';

export const AccountStatementPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useAccountStatement(
    clientId ? parseInt(clientId) : null,
    page,
    limit,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando estado de cuenta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">
            No se pudo cargar el estado de cuenta. Por favor, intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Estado de Cuenta
            </h1>
            <p className="text-gray-600 mt-1">
              {data.client.name} - DNI: {data.client.dni}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Saldo actual</p>
            <p
              className={`text-3xl font-bold ${
                data.currentBalance > 0
                  ? 'text-red-600'
                  : data.currentBalance < 0
                    ? 'text-green-600'
                    : 'text-gray-900'
              }`}
            >
              {formatCurrency(data.currentBalance)}
            </p>
          </div>
        </div>

        {data.currentBalance > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800">
              ⚠️ El cliente tiene deuda pendiente de{' '}
              <span className="font-semibold">
                {formatCurrency(data.currentBalance)}
              </span>
            </p>
          </div>
        )}

        {data.currentBalance === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              ✓ El cliente no tiene deudas pendientes
            </p>
          </div>
        )}
      </div>

      {/* Movimientos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Movimientos ({data.pagination.total})
        </h2>

        {data.movements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No hay movimientos registrados</p>
          </div>
        ) : (
          <>
            {data.movements.map((movement) => (
              <AccountMovementCard key={movement.id} movement={movement} />
            ))}

            {/* Paginación */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <span className="text-gray-600">
                  Página {page} de {data.pagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
