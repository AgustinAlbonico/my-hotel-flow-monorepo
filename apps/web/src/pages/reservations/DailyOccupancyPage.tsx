/**
 * DailyOccupancyPage
 * Reporte visual de ocupación diaria por tipo de habitación.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDailyOccupancy } from '@/api/occupancy.api';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  Loader2,
  Percent,
} from 'lucide-react';

export const DailyOccupancyPage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['occupancy', 'daily', date],
    queryFn: () => getDailyOccupancy(date),
  });

  const safeSummary = data?.summary ?? [];
  const totalRooms = safeSummary.reduce((acc, item) => acc + item.total, 0);
  const totalOccupied = safeSummary.reduce(
    (acc, item) => acc + item.occupied,
    0,
  );
  const globalOccupancy =
    totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <button
          onClick={() => navigate('/reservations')}
          className="hover:text-primary-600"
        >
          Gestión de Reservas
        </button>
        <ChevronRight className="inline mx-2" size={14} />
        <span className="text-gray-900 font-medium">Ocupación Diaria</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Ocupación Diaria
          </h1>
          <p className="text-gray-600 text-sm">
            Visualizá cuántas habitaciones están ocupadas, reservadas y disponibles
            por tipo para una fecha específica.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
            <Calendar size={16} className="text-primary-600" />
            Fecha de consulta
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Resumen global */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total de habitaciones</p>
            <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
          </div>
          <BarChart3 className="text-primary-600" size={32} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Habitaciones ocupadas</p>
            <p className="text-2xl font-bold text-gray-900">{totalOccupied}</p>
          </div>
          <Activity className="text-green-600" size={32} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Ocupación global</p>
            <p className="text-2xl font-bold text-gray-900">
              {globalOccupancy}%
            </p>
          </div>
          <Percent className="text-amber-600" size={32} />
        </div>
      </div>

      {/* Loading / error / tabla */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 mb-3" size={32} />
          <p className="text-sm text-gray-600">
            Calculando ocupación para la fecha seleccionada...
          </p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 flex items-start gap-3">
          <Activity className="text-red-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Error al obtener la ocupación
            </p>
            <p className="text-xs text-red-700">
              {error instanceof Error ? error.message : 'Error desconocido.'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-700">
            <BarChart3 size={16} className="text-primary-600" />
            <span>Detalle por tipo de habitación</span>
          </div>
          {safeSummary.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-500">
              No hay datos de ocupación para la fecha seleccionada.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {safeSummary.map((item) => (
                <div
                  key={item.roomType}
                  className="px-4 py-4 grid gap-3 md:grid-cols-5 items-center"
                >
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Tipo de habitación</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.roomType}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Total {item.total} · Ocupadas {item.occupied} · Reservadas{' '}
                      {item.reserved} · Disponibles {item.available}
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Ocupación {item.occupancyPercentage}%
                    </p>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-3 bg-primary-500 transition-all"
                        style={{ width: `${item.occupancyPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyOccupancyPage;


