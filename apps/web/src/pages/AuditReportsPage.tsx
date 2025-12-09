/**
 * Página de Reportes de Auditoría
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReservationChanges,
  getUserSessions,
  getUserActivity,
  getAuditSummary,
  ReservationAuditFilters,
  UserSessionFilters,
  UserActivityFilters,
  AuditSummaryFilters,
} from '@/api/audit.api';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

type TabType = 'summary' | 'reservations' | 'sessions' | 'activity';

// Funciones helper para rangos de fechas predefinidos
const getDateRangePreset = (preset: string): { startDate: string; endDate: string } => {
  const today = new Date();
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
  
  switch (preset) {
    case '7days':
      return { startDate: formatDate(subDays(today, 7)), endDate: formatDate(today) };
    case '30days':
      return { startDate: formatDate(subDays(today, 30)), endDate: formatDate(today) };
    case '90days':
      return { startDate: formatDate(subDays(today, 90)), endDate: formatDate(today) };
    case 'thisMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(firstDay), endDate: formatDate(today) };
    }
    case 'lastMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    default:
      return { startDate: formatDate(subDays(today, 7)), endDate: formatDate(today) };
  }
};

export default function AuditReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [summaryFilters, setSummaryFilters] = useState<AuditSummaryFilters>({});
  const [reservationFilters, setReservationFilters] = useState<ReservationAuditFilters>({
    page: 1,
    limit: 50,
  });
  const [sessionFilters, setSessionFilters] = useState<UserSessionFilters>({
    page: 1,
    limit: 50,
  });
  const [activityFilters, setActivityFilters] = useState<UserActivityFilters>({
    page: 1,
    limit: 100,
  });

  // Queries
  const summaryQuery = useQuery({
    queryKey: ['audit-summary', summaryFilters],
    queryFn: () => getAuditSummary(summaryFilters),
    enabled: activeTab === 'summary',
  });

  const reservationChangesQuery = useQuery({
    queryKey: ['audit-reservation-changes', reservationFilters],
    queryFn: () => getReservationChanges(reservationFilters),
    enabled: activeTab === 'reservations',
  });

  const sessionsQuery = useQuery({
    queryKey: ['audit-sessions', sessionFilters],
    queryFn: () => getUserSessions(sessionFilters),
    enabled: activeTab === 'sessions',
  });

  const activityQuery = useQuery({
    queryKey: ['audit-activity', activityFilters],
    queryFn: () => getUserActivity(activityFilters),
    enabled: activeTab === 'activity',
  });

  const tabs = [
    { id: 'summary' as TabType, label: 'Resumen', icon: '📊' },
    { id: 'reservations' as TabType, label: 'Cambios en Reservas', icon: '📝' },
    { id: 'sessions' as TabType, label: 'Sesiones', icon: '🔐' },
    { id: 'activity' as TabType, label: 'Actividad', icon: '🎯' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
        <p className="mt-2 text-gray-600">
          Historial completo de operaciones y cambios en el sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'summary' && (
          <SummaryTab 
            query={summaryQuery} 
            filters={summaryFilters}
            setFilters={setSummaryFilters}
            getDateRangePreset={getDateRangePreset}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationChangesTab
            query={reservationChangesQuery}
            filters={reservationFilters}
            setFilters={setReservationFilters}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            query={sessionsQuery}
            filters={sessionFilters}
            setFilters={setSessionFilters}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab
            query={activityQuery}
            filters={activityFilters}
            setFilters={setActivityFilters}
          />
        )}
      </div>
    </div>
  );
}

// ==================== Summary Tab ====================
function SummaryTab({ query, filters, setFilters, getDateRangePreset }: any) {
  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') return;
    const { startDate, endDate } = getDateRangePreset(preset);
    setFilters({ startDate, endDate });
  };

  if (query.isLoading) {
    return <div className="p-8 text-center">Cargando resumen...</div>;
  }

  if (query.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error al cargar el resumen
        </div>
      </div>
    );
  }

  const data = query.data?.data;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">
          Resumen de Auditoría
        </h2>
        
        {/* Filtros de fecha */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 py-2 text-sm"
            onChange={(e) => handlePresetChange(e.target.value)}
            defaultValue="7days"
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 90 días</option>
            <option value="thisMonth">Este mes</option>
            <option value="lastMonth">Mes anterior</option>
            <option value="custom">Personalizado</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Indicador del período actual */}
      {data?.period && (
        <div className="mb-6 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded">
          Mostrando datos desde{' '}
          <span className="font-medium">
            {format(new Date(data.period.startDate), 'dd/MM/yyyy', { locale: es })}
          </span>{' '}
          hasta{' '}
          <span className="font-medium">
            {format(new Date(data.period.endDate), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Cambios en Reservas */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-sm font-medium text-blue-600 mb-2">
            Cambios en Reservas
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {data?.reservationChanges.total || 0}
          </div>
        </div>

        {/* Sesiones */}
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-sm font-medium text-green-600 mb-2">Sesiones</div>
          <div className="text-3xl font-bold text-green-900">
            {data?.sessions.total || 0}
          </div>
          <div className="text-sm text-green-600 mt-2">
            {data?.sessions.active || 0} activas
          </div>
        </div>

        {/* Actividades */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-sm font-medium text-purple-600 mb-2">
            Actividades
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {data?.activity.total || 0}
          </div>
        </div>
      </div>

      {/* Cambios por Tipo de Acción */}
      {data?.reservationChanges.byAction && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Cambios por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(data.reservationChanges.byAction).map(([action, count]) => (
              <div key={action} className="bg-gray-50 p-4 rounded">
                <div className="text-xs text-gray-600 mb-1">{action}</div>
                <div className="text-2xl font-bold text-gray-900">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Usuarios */}
      {data?.topUsers && data.topUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Usuarios Más Activos</h3>
          <div className="space-y-2">
            {data.topUsers.map((user: any, idx: number) => (
              <div
                key={user.userId}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400">#{idx + 1}</div>
                  <div>
                    <div className="font-medium">Usuario ID: {user.userId}</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {user.actions} acciones
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Reservation Changes Tab ====================
function ReservationChangesTab({ query, filters, setFilters }: any) {
  if (query.isLoading) {
    return <div className="p-8 text-center">Cargando cambios...</div>;
  }

  if (query.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error al cargar los cambios
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-6">Cambios en Reservas</h2>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="number"
          placeholder="ID Reserva"
          className="border rounded px-3 py-2"
          value={filters.reservationId || ''}
          onChange={(e) =>
            setFilters({ ...filters, reservationId: e.target.value || undefined })
          }
        />
        <input
          type="date"
          placeholder="Fecha Inicio"
          className="border rounded px-3 py-2"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha Fin"
          className="border rounded px-3 py-2"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
        <select
          className="border rounded px-3 py-2"
          value={filters.actionType || ''}
          onChange={(e) =>
            setFilters({ ...filters, actionType: e.target.value || undefined })
          }
        >
          <option value="">Todos los tipos</option>
          <option value="CREATE">Creación</option>
          <option value="UPDATE">Actualización</option>
          <option value="CANCEL">Cancelación</option>
          <option value="CHECK_IN">Check-in</option>
          <option value="CHECK_OUT">Check-out</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reserva
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data.map((log: any) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{log.reservationId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.actionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.changedByUsername}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(log.changedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {data?.pagination && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {data.data.length} de {data.pagination.total} registros
          </div>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2">
              Página {filters.page} de {data.pagination.totalPages}
            </span>
            <button
              disabled={filters.page >= data.pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sessions Tab ====================
function SessionsTab({ query, filters, setFilters }: any) {
  if (query.isLoading) {
    return <div className="p-8 text-center">Cargando sesiones...</div>;
  }

  if (query.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error al cargar las sesiones
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-6">Sesiones de Usuario</h2>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="number"
          placeholder="ID Usuario"
          className="border rounded px-3 py-2"
          value={filters.userId || ''}
          onChange={(e) =>
            setFilters({ ...filters, userId: e.target.value || undefined })
          }
        />
        <select
          className="border rounded px-3 py-2"
          value={filters.isActive?.toString() || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              isActive: e.target.value ? e.target.value === 'true' : undefined,
            })
          }
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Cerradas</option>
        </select>
        <input
          type="date"
          placeholder="Fecha Inicio"
          className="border rounded px-3 py-2"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha Fin"
          className="border rounded px-3 py-2"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      {/* Lista de sesiones */}
      <div className="space-y-4">
        {data?.data.map((session: any) => (
          <div
            key={session.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{session.username}</div>
              <div className="text-sm text-gray-500">
                Login: {format(new Date(session.loginAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
              {session.logoutAt && (
                <div className="text-sm text-gray-500">
                  Logout: {format(new Date(session.logoutAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </div>
              )}
              {session.duration && (
                <div className="text-sm text-gray-500">
                  Duración: {Math.round(session.duration / 60)} minutos
                </div>
              )}
            </div>
            <div>
              {session.isActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Activa
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  Cerrada
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {data?.pagination && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {data.data.length} de {data.pagination.total} sesiones
          </div>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2">
              Página {filters.page} de {data.pagination.totalPages}
            </span>
            <button
              disabled={filters.page >= data.pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Activity Tab ====================
function ActivityTab({ query, filters, setFilters }: any) {
  if (query.isLoading) {
    return <div className="p-8 text-center">Cargando actividad...</div>;
  }

  if (query.error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error al cargar la actividad
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-6">Actividad de Usuarios</h2>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="number"
          placeholder="ID Usuario"
          className="border rounded px-3 py-2"
          value={filters.userId || ''}
          onChange={(e) =>
            setFilters({ ...filters, userId: e.target.value || undefined })
          }
        />
        <select
          className="border rounded px-3 py-2"
          value={filters.activityType || ''}
          onChange={(e) =>
            setFilters({ ...filters, activityType: e.target.value || undefined })
          }
        >
          <option value="">Todos los tipos</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE">Creación</option>
          <option value="UPDATE">Actualización</option>
          <option value="DELETE">Eliminación</option>
          <option value="VIEW">Visualización</option>
        </select>
        <input
          type="date"
          placeholder="Fecha Inicio"
          className="border rounded px-3 py-2"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha Fin"
          className="border rounded px-3 py-2"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        {data?.data.map((activity: any) => (
          <div key={activity.id} className="border-l-4 border-blue-500 bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium">{activity.activityDescription}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {activity.httpMethod} {activity.endpoint}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {format(new Date(activity.activityAt), 'dd/MM HH:mm')}
                </div>
                {activity.responseTimeMs && (
                  <div className="text-xs text-gray-400">{activity.responseTimeMs}ms</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {data?.pagination && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {data.data.length} de {data.pagination.total} actividades
          </div>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2">
              Página {filters.page} de {data.pagination.totalPages}
            </span>
            <button
              disabled={filters.page >= data.pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
