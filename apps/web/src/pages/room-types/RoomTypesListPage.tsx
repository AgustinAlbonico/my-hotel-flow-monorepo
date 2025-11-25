/**
 * RoomTypesListPage - Listado de tipos de habitación
 * Siguiendo MEJORES_PRACTICAS.md - Componentes funcionales
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomTypes } from '@/hooks/useRoomTypes';
import { Can } from '@/components/auth/Can';
import { Plus, Edit, Trash2, Loader2, Search, Users, DollarSign } from 'lucide-react';
import { RoomTypeResponse } from '@/api/roomTypes.api';

export const RoomTypesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomTypes, isLoading, deleteRoomType } = useRoomTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filtrar tipos
  const filteredRoomTypes = React.useMemo(() => {
    if (!roomTypes) return [];

    return roomTypes.filter((type: RoomTypeResponse) => {
      const matchesSearch =
        searchTerm === '' ||
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.code.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [roomTypes, searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el tipo de habitación "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteRoomType(id);
    } catch {
      alert('Error al eliminar el tipo de habitación');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipos de Habitación</h1>
          <p className="text-gray-600 mt-1">Gestión de tipos de habitación y precios</p>
        </div>

        <Can perform="habitaciones.crear">
          <button
            onClick={() => navigate('/room-types/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Tipo
          </button>
        </Can>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Mostrando {filteredRoomTypes.length} de {roomTypes?.length || 0} tipos de habitación
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoomTypes.length > 0 ? (
          filteredRoomTypes.map((type: RoomTypeResponse) => (
            <div
              key={type.id}
              className={`card p-6 hover:shadow-lg transition-shadow ${
                !type.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{type.name}</h3>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 inline-block">
                    {type.code}
                  </code>
                </div>
                {!type.isActive && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Inactivo
                  </span>
                )}
              </div>

              {type.descripcion && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{type.descripcion}</p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign size={18} className="text-primary-600" />
                  <span className="font-semibold text-lg">{formatPrice(type.precioPorNoche)}</span>
                  <span className="text-sm text-gray-500">/ noche</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Users size={18} className="text-primary-600" />
                  <span className="text-sm">
                    Hasta {type.capacidadMaxima}{' '}
                    {type.capacidadMaxima === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
              </div>

              {type.caracteristicas && type.caracteristicas.length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">CARACTERÍSTICAS:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {type.caracteristicas.slice(0, 3).map((caracteristica) => (
                      <li key={caracteristica.id} className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span className="line-clamp-1">{caracteristica.nombre}</span>
                      </li>
                    ))}
                    {type.caracteristicas.length > 3 && (
                      <li className="text-xs text-gray-500 italic">
                        +{type.caracteristicas.length - 3} más...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Can perform="habitaciones.modificar">
                  <button
                    onClick={() => navigate(`/room-types/edit/${type.id}`)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                </Can>

                <Can perform="habitaciones.eliminar">
                  <button
                    onClick={() => handleDelete(type.id, type.name)}
                    disabled={deletingId === type.id}
                    className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === type.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Eliminar
                  </button>
                </Can>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No hay tipos de habitación disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};
