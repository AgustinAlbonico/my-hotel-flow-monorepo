/**
 * Componente para mostrar el historial de auditoría de una reserva
 */
import { useEffect, useState } from 'react';
import { getReservationHistory, ReservationAuditLog } from '@/api/audit.api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReservationAuditHistoryProps {
  reservationId: number;
}

const actionTypeLabels: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  UPDATE_DATES: 'Cambio de Fechas',
  CANCEL: 'Cancelación',
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  PAYMENT_REGISTERED: 'Pago Registrado',
  INVOICE_GENERATED: 'Factura Generada',
  STATUS_CHANGED: 'Cambio de Estado',
};

const actionTypeColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  UPDATE_DATES: 'bg-yellow-100 text-yellow-800',
  CANCEL: 'bg-red-100 text-red-800',
  CHECK_IN: 'bg-indigo-100 text-indigo-800',
  CHECK_OUT: 'bg-purple-100 text-purple-800',
  PAYMENT_REGISTERED: 'bg-emerald-100 text-emerald-800',
  INVOICE_GENERATED: 'bg-cyan-100 text-cyan-800',
  STATUS_CHANGED: 'bg-orange-100 text-orange-800',
};

export default function ReservationAuditHistory({
  reservationId,
}: ReservationAuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<ReservationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuditHistory();
  }, [reservationId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReservationHistory(reservationId);
      setAuditLogs(response.data);
    } catch (err: any) {
      console.error('Error loading audit history:', err);
      setError(err.response?.data?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cambios registrados para esta reserva
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Cambios
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {auditLogs.map((log, idx) => (
            <li key={log.id}>
              <div className="relative pb-8">
                {idx !== auditLogs.length - 1 && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        actionTypeColors[log.actionType] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {actionTypeLabels[log.actionType] || log.actionType}
                      </p>

                      {log.fieldChanged && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Campo:</span>{' '}
                          {log.fieldChanged}
                          <div className="mt-1 space-y-1">
                            {log.oldValue && (
                              <div>
                                <span className="text-red-600">- Anterior:</span>{' '}
                                <code className="bg-red-50 px-2 py-0.5 rounded text-xs">
                                  {log.oldValue}
                                </code>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <span className="text-green-600">+ Nuevo:</span>{' '}
                                <code className="bg-green-50 px-2 py-0.5 rounded text-xs">
                                  {log.newValue}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {log.changeReason && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          Motivo: {log.changeReason}
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Ver detalles técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {log.changedByUsername}
                        </span>

                        {log.changedBySystem && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {log.changedBySystem}
                          </span>
                        )}

                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                              />
                            </svg>
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={log.changedAt}>{formatDate(log.changedAt)}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
