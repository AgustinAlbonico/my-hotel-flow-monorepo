/**
 * RoomTypeForm - Formulario reutilizable para crear/editar tipos de habitación
 * Siguiendo MEJORES_PRACTICAS.md - Validación con react-hook-form + Zod
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomTypeSchema, RoomTypeFormData } from '@/schemas/roomType.schema';
import { AlertTriangle } from 'lucide-react';
import { RoomTypeResponse } from '@/api/roomTypes.api';
import CaracteristicaSelector from '../caracteristicas/CaracteristicaSelector';

interface RoomTypeFormProps {
  initialData?: RoomTypeResponse;
  onSubmit: (data: RoomTypeFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RoomTypeFormData>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          precioPorNoche: initialData.precioPorNoche,
          capacidadMaxima: initialData.capacidadMaxima,
          descripcion: initialData.descripcion || '',
          caracteristicasIds: initialData.caracteristicas?.map((c) => c.id) || [],
        }
      : {
          caracteristicasIds: [],
        },
  });

  // Actualizar el formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      const formData = {
        code: initialData.code,
        name: initialData.name,
        precioPorNoche: initialData.precioPorNoche,
        capacidadMaxima: initialData.capacidadMaxima,
        descripcion: initialData.descripcion || '',
        caracteristicasIds: initialData.caracteristicas?.map((c) => c.id) || [],
      };
      reset(formData);
    }
  }, [initialData, reset]);

  const selectedCaracteristicasIds = watch('caracteristicasIds') || [];

  const handleFormSubmit = async (data: RoomTypeFormData) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Error al ${isEditing ? 'actualizar' : 'crear'} tipo de habitación`;
      setError(errorMessage);
    }
  };

  return (
    <div className="card p-6">
      {error && (
        <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-error-500 mt-0.5 mr-3" size={20} />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Código del tipo */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Código del Tipo <span className="text-error-500">*</span>
          </label>
          <input
            id="code"
            type="text"
            className="input"
            disabled={isEditing} // No se puede cambiar el código al editar
            placeholder="estandar, suite-deluxe, familiar-vista-mar"
            {...register('code')}
          />
          {errors.code && (
            <p className="text-error-600 text-sm mt-1">{errors.code.message}</p>
          )}
          {isEditing ? (
            <p className="text-sm text-gray-500 mt-1">
              El código no puede modificarse una vez creado
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              Solo letras minúsculas, números y guiones. Ej: "estandar", "suite-deluxe"
            </p>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-error-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="input"
            placeholder="Habitación Estándar"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-error-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Precio por noche */}
          <div>
            <label
              htmlFor="precioPorNoche"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Precio por Noche <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="precioPorNoche"
                type="number"
                step="0.01"
                className="input pl-8"
                placeholder="1500.00"
                {...register('precioPorNoche', { valueAsNumber: true })}
              />
            </div>
            {errors.precioPorNoche && (
              <p className="text-error-600 text-sm mt-1">{errors.precioPorNoche.message}</p>
            )}
          </div>

          {/* Capacidad máxima */}
          <div>
            <label
              htmlFor="capacidadMaxima"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Capacidad Máxima <span className="text-error-500">*</span>
            </label>
            <input
              id="capacidadMaxima"
              type="number"
              min="1"
              max="10"
              className="input"
              placeholder="2"
              {...register('capacidadMaxima', { valueAsNumber: true })}
            />
            {errors.capacidadMaxima && (
              <p className="text-error-600 text-sm mt-1">{errors.capacidadMaxima.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Personas (1-10)</p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            rows={4}
            className="input"
            placeholder="Describe las características generales de este tipo de habitación..."
            {...register('descripcion')}
          />
          {errors.descripcion && (
            <p className="text-error-600 text-sm mt-1">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Características incluidas */}
        <CaracteristicaSelector
          selectedIds={selectedCaracteristicasIds}
          onChange={(ids) => setValue('caracteristicasIds', ids)}
        />

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-ghost flex-1"
          >
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : isEditing ? (
              'Actualizar Tipo'
            ) : (
              'Crear Tipo'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
