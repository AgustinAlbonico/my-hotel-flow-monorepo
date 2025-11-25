/**
 * RoomTypeFormPage - Página para crear/editar tipos de habitación
 * Siguiendo MEJORES_PRACTICAS.md - React Hook Form + Zod
 */
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomTypes, useRoomTypeById } from '@/hooks/useRoomTypes';
import { RoomTypeForm } from '@/components/features/RoomTypeForm';
import { RoomTypeFormData } from '@/schemas/roomType.schema';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const RoomTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { createRoomType, updateRoomType, isCreating, isUpdating } = useRoomTypes();

  // Cargar tipo de habitación si estamos editando
  const { data: roomTypeData, isLoading: loadingRoomType } = useRoomTypeById(
    id ? parseInt(id) : undefined
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: RoomTypeFormData) => {
    try {
      setError(null);
      if (isEditing && id) {
        await updateRoomType({
          id: parseInt(id),
          data: {
            name: data.name,
            precioPorNoche: data.precioPorNoche,
            capacidadMaxima: data.capacidadMaxima,
            descripcion: data.descripcion || undefined,
            caracteristicasIds: data.caracteristicasIds,
          },
        });
      } else {
        await createRoomType(data);
      }
      navigate('/room-types');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Error al ${isEditing ? 'actualizar' : 'crear'} tipo`;
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/room-types');
  };

  if (isEditing && loadingRoomType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (isEditing && !roomTypeData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md">
          <p className="text-error-700">Tipo de habitación no encontrado</p>
        </div>
        <button onClick={handleCancel} className="btn-ghost mt-4">
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={handleCancel} className="btn-ghost flex items-center gap-2 mb-6">
        <ArrowLeft size={20} />
        Volver a tipos de habitación
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Tipo de Habitación' : 'Crear Tipo de Habitación'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? 'Actualiza la información del tipo de habitación'
            : 'Completa los datos del nuevo tipo de habitación'}
        </p>
      </div>

      {error && (
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md mb-6">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      <RoomTypeForm
        initialData={roomTypeData || undefined}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        onCancel={handleCancel}
      />
    </div>
  );
};
