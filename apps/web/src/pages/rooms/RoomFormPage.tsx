import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { createRoom, updateRoom, getRoomById, type CreateRoomRequest } from '../../api/rooms.api';
import { useRoomTypes } from '../../hooks/useRoomTypes';
import { useState, useEffect } from 'react';

const roomSchema = z.object({
  numeroHabitacion: z.string().min(1, 'Número de habitación es requerido'),
  roomTypeId: z.number({ required_error: 'Debe seleccionar un tipo de habitación' }).positive(),
  descripcion: z.string().optional(),
  caracteristicasAdicionales: z.array(z.string()).optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

/**
 * RoomFormPage
 * Componente: Formulario de creación/edición de habitación
 */
export default function RoomFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Cargar tipos de habitación activos
  const { activeRoomTypes } = useRoomTypes();

  // Cargar datos si es edición
  const { data: room } = useQuery({
    queryKey: ['room', id],
    queryFn: () => getRoomById(Number(id)),
    enabled: isEditMode
  });

  // Estado para el tipo seleccionado
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      numeroHabitacion: '',
      roomTypeId: 0,
      descripcion: '',
      caracteristicasAdicionales: [],
    },
  });

  // Actualizar form con datos de la habitación al editar
  useEffect(() => {
    if (room && isEditMode) {
      setValue('numeroHabitacion', room.numeroHabitacion);
      setValue('descripcion', room.descripcion || '');
      // En edición, no podemos determinar roomTypeId del room directamente
      // porque solo tenemos el código del tipo, necesitamos buscarlo
      const roomType = activeRoomTypes.find(rt => rt.code === room.tipo);
      if (roomType) {
        setValue('roomTypeId', roomType.id);
        setSelectedRoomTypeId(roomType.id);
      }
    }
  }, [room, isEditMode, setValue, activeRoomTypes]);

  // Observar cambios en roomTypeId
  const roomTypeIdValue = watch('roomTypeId');

  useEffect(() => {
    if (roomTypeIdValue) {
      setSelectedRoomTypeId(roomTypeIdValue);
    }
  }, [roomTypeIdValue]);

  // Obtener información del tipo seleccionado
  const selectedRoomType = activeRoomTypes.find(rt => rt.id === selectedRoomTypeId);

  const mutation = useMutation({
    mutationFn: (data: CreateRoomRequest) =>
      isEditMode ? updateRoom(Number(id), data) : createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/rooms');
    },
  });

  const onSubmit = (data: RoomFormData) => {
    mutation.mutate(data as CreateRoomRequest);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/rooms')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Habitación' : 'Nueva Habitación'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Habitación *
            </label>
            <input
              {...register('numeroHabitacion')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              placeholder="101"
            />
            {errors.numeroHabitacion && (
              <p className="text-error-600 text-sm mt-1">{errors.numeroHabitacion.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Habitación *
            </label>
            <select
              {...register('roomTypeId', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value={0}>Seleccione un tipo</option>
              {activeRoomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.roomTypeId && (
              <p className="text-error-600 text-sm mt-1">{errors.roomTypeId.message}</p>
            )}
          </div>
        </div>

        {/* Información del tipo seleccionado */}
        {selectedRoomType && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Información del Tipo Seleccionado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Capacidad:</span>{' '}
                <span className="text-blue-900">{selectedRoomType.capacidadMaxima} personas</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Precio por noche:</span>{' '}
                <span className="text-blue-900">
                  ${selectedRoomType.precioPorNoche.toLocaleString('es-AR')}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Código:</span>{' '}
                <span className="text-blue-900">{selectedRoomType.code}</span>
              </div>
            </div>
            {selectedRoomType.descripcion && (
              <p className="text-blue-800 text-sm mt-2">{selectedRoomType.descripcion}</p>
            )}
            {selectedRoomType.caracteristicas && selectedRoomType.caracteristicas.length > 0 && (
              <div className="mt-2">
                <span className="text-blue-700 font-medium text-sm">Características incluidas:</span>
                <ul className="mt-1 text-sm text-blue-800 list-disc list-inside">
                  {selectedRoomType.caracteristicas.map((car: { id: number; nombre: string }) => (
                    <li key={car.id}>{car.nombre}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('descripcion')}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            placeholder="Descripción de la habitación"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Save className="w-5 h-5" />
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
