import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { getRoomById } from '../../api/rooms.api';
import { Can } from '../../components/auth/Can';

/**
 * RoomDetailPage
 * Componente: Página de detalles de habitación
 * Responsabilidad: Mostrar información completa de una habitación
 */
export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['room', id],
    queryFn: () => getRoomById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
        <p>Error al cargar la habitación</p>
      </div>
    );
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ESTANDAR: 'Estándar',
      SUITE: 'Suite',
      FAMILIAR: 'Familiar',
    };
    return labels[tipo] || tipo;
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      OCCUPIED: 'Ocupada',
      MAINTENANCE: 'Mantenimiento',
      OUT_OF_SERVICE: 'Fuera de servicio',
    };
    return labels[estado] || estado;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rooms')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Habitación {room.numeroHabitacion}
            </h1>
            <p className="text-gray-600 mt-1">Detalles de la habitación</p>
          </div>
        </div>
        <Can perform={['habitaciones.modificar']}>
          <button
            onClick={() => navigate(`/rooms/${id}/edit`)}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit className="w-5 h-5" />
            Editar
          </button>
        </Can>
      </div>

      {/* Información */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Número de Habitación
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {room.numeroHabitacion}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {room.tipoNombre || getTipoLabel(room.tipo)}
            </p>
            <p className="text-sm text-gray-500">
              {room.tipo}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {getEstadoLabel(room.estado)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Capacidad
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {room.capacidad} {room.capacidad === 1 ? 'persona' : 'personas'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Precio por Noche
            </label>
            <p className="text-lg font-semibold text-gray-900">
              ${room.precioPorNoche.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {room.isActive ? 'Activa' : 'Inactiva'}
            </p>
          </div>
        </div>

        {room.descripcion && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <p className="text-gray-900">{room.descripcion}</p>
          </div>
        )}

        {room.caracteristicas && room.caracteristicas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Características
            </label>
            <div className="flex flex-wrap gap-2">
              {room.caracteristicas.map((caracteristica, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                >
                  {caracteristica}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
