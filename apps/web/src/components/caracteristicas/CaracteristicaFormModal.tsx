import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import {
  createCaracteristica,
  updateCaracteristica,
  type Caracteristica,
  type CreateCaracteristicaRequest,
  type UpdateCaracteristicaRequest,
} from '../../api/caracteristicas.api';

interface CaracteristicaFormModalProps {
  caracteristica: Caracteristica | null;
  onClose: () => void;
}

/**
 * CaracteristicaFormModal
 * Componente: Modal con formulario para crear/editar características
 */
export default function CaracteristicaFormModal({
  caracteristica,
  onClose,
}: CaracteristicaFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (caracteristica) {
      setFormData({
        nombre: caracteristica.nombre,
        descripcion: caracteristica.descripcion || '',
        isActive: caracteristica.isActive,
      });
    }
  }, [caracteristica]);

  const createMutation = useMutation({
    mutationFn: createCaracteristica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caracteristicas'] });
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al crear la característica';
      setErrors({ submit: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCaracteristicaRequest }) =>
      updateCaracteristica(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caracteristicas'] });
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al actualizar la característica';
      setErrors({ submit: message });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (caracteristica) {
      // Actualizar
      const updateData: UpdateCaracteristicaRequest = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({
        id: caracteristica.id,
        data: updateData,
      });
    } else {
      // Crear
      const createData: CreateCaracteristicaRequest = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
      };
      await createMutation.mutateAsync(createData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {caracteristica ? 'Editar' : 'Nueva'} Característica
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre <span className="text-error-600">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className={`w-full border ${
                errors.nombre ? 'border-error-300' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Ej: Wi-Fi, Aire Acondicionado"
              maxLength={100}
            />
            {errors.nombre && (
              <p className="text-error-600 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
              className={`w-full border ${
                errors.descripcion ? 'border-error-300' : 'border-gray-300'
              } rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Descripción opcional de la característica"
              maxLength={500}
            />
            {errors.descripcion && (
              <p className="text-error-600 text-sm mt-1">{errors.descripcion}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>

          {/* Estado (solo en edición) */}
          {caracteristica && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Característica activa
                </span>
              </label>
            </div>
          )}

          {/* Error de envío */}
          {errors.submit && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              <p className="text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Guardando...'
                : caracteristica
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
