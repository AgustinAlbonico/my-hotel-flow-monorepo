/**
 * DashboardStats - Componente de estadísticas con gráficos
 * Fase 3 - UI/UX: Visualización de datos con Recharts
 * Actualizado para usar datos reales del backend
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Bed, DollarSign, Loader2, Calendar } from 'lucide-react';
import { getDashboardStats, DashboardStatsFilters } from '@/api/dashboard.api';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const iconMap = {
  primary: Bed,
  success: TrendingUp,
  info: Users,
  warning: DollarSign,
};

// Funciones helper para rangos de fechas predefinidos
const getDateRangePreset = (preset: string): { startDate: string; endDate: string } => {
  const today = new Date();
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
  
  switch (preset) {
    case 'thisMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(firstDay), endDate: formatDate(today) };
    }
    case 'lastMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case '7days':
      return { startDate: formatDate(subDays(today, 7)), endDate: formatDate(today) };
    case '30days':
      return { startDate: formatDate(subDays(today, 30)), endDate: formatDate(today) };
    case '90days':
      return { startDate: formatDate(subDays(today, 90)), endDate: formatDate(today) };
    case 'thisYear': {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(firstDay), endDate: formatDate(today) };
    }
    default:
      return { startDate: '', endDate: '' }; // Default: mes actual (manejado por backend)
  }
};

export const DashboardStats: React.FC = () => {
  const [filters, setFilters] = useState<DashboardStatsFilters>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('default');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => getDashboardStats(filters),
    refetchInterval: 60000, // Refrescar cada minuto
  });

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'default') {
      setFilters({});
    } else if (preset !== 'custom') {
      const { startDate, endDate } = getDateRangePreset(preset);
      setFilters({ startDate, endDate });
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      primary: {
        bg: 'bg-primary-100 dark:bg-primary-900 dark:bg-opacity-30',
        icon: 'text-primary-600 dark:text-primary-400',
      },
      success: {
        bg: 'bg-success-100 dark:bg-success-900 dark:bg-opacity-30',
        icon: 'text-success-600 dark:text-success-400',
      },
      info: {
        bg: 'bg-info-100 dark:bg-info-900 dark:bg-opacity-30',
        icon: 'text-info-600 dark:text-info-400',
      },
      warning: {
        bg: 'bg-warning-100 dark:bg-warning-900 dark:bg-opacity-30',
        icon: 'text-warning-600 dark:text-warning-400',
      },
    };
    return colors[color] || colors.primary;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card p-6 text-center">
        <p className="text-error-600">Error al cargar las estadísticas del dashboard</p>
      </div>
    );
  }

  const { statsCards, monthlyReservations, roomOccupancy, reservationStatus } = data;

  // Calcular totales para el resumen del día
  const checkInToday = reservationStatus.find(s => s.name === 'Check-In Hoy')?.value || 0;
  const checkOutToday = reservationStatus.find(s => s.name === 'Check-Out Hoy')?.value || 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Filtros de fecha */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" size={20} />
            <span className="font-medium text-gray-700 dark:text-gray-300">Período de análisis:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="default">Mes actual</option>
              <option value="lastMonth">Mes anterior</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisYear">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
            
            {selectedPreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <span className="text-gray-500">a</span>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Indicador del período actual */}
        {data.period && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color);
          const Icon = iconMap[stat.color as keyof typeof iconMap] || Bed;
          return (
            <div
              key={index}
              className="card p-6 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                  <Icon className={colorClasses.icon} size={24} />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservas e Ingresos Mensuales */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Reservas e Ingresos Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyReservations}>
              <defs>
                <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="reservas"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorReservas)"
                name="Reservas"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIngresos)"
                name="Ingresos ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ocupación por Tipo de Habitación */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Ocupación por Tipo de Habitación
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomOccupancy}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="tipo" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="ocupadas" fill="#10b981" name="Ocupadas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="disponibles" fill="#94a3b8" name="Disponibles" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estado de Reservas */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Estado de Reservas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reservationStatus as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reservationStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen Rápido */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resumen del Día
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Check-Ins Programados</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{checkInToday}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Check-Outs Programados</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{checkOutToday}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Reservas Activas</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {reservationStatus.find(s => s.name === 'Confirmadas')?.value || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habitaciones Ocupadas</span>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {roomOccupancy.reduce((acc, room) => acc + room.ocupadas, 0)}/
                {roomOccupancy.reduce((acc, room) => acc + room.ocupadas + room.disponibles, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

