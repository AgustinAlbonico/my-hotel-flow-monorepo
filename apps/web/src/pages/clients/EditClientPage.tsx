import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { getClientById, updateClient, UpdateClientRequest } from '../../api/clients.api';

const updateClientSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres').max(15).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  address: z.string().max(255, 'La dirección no puede exceder 255 caracteres').optional().or(z.literal('')),
  city: z.string().max(100, 'La ciudad no puede exceder 100 caracteres').optional().or(z.literal('')),
  country: z.string().max(100, 'El país no puede exceder 100 caracteres').optional().or(z.literal('')),
  nationality: z.string().max(100, 'La nacionalidad no puede exceder 100 caracteres').optional().or(z.literal('')),
  observations: z.string().optional().or(z.literal('')),
});

type UpdateClientForm = z.infer<typeof updateClientSchema>;

/**
 * EditClientPage Component
 * Formulario para editar los datos de un cliente
 */
export default function EditClientPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateClientForm>({
    resolver: zodResolver(updateClientSchema),
    values: client
      ? {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone || '',
          birthDate: client.birthDate || '',
          address: client.address || '',
          city: client.city || '',
          country: client.country || '',
          nationality: client.nationality || '',
          observations: client.observations || '',
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientRequest) => updateClient(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate(`/clients/${id}`);
    },
    onError: () => {
      alert('Error al actualizar el cliente');
    },
  });

  const onSubmit = (data: UpdateClientForm) => {
    const payload: UpdateClientRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      birthDate: data.birthDate || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      nationality: data.nationality || undefined,
      observations: data.observations || undefined,
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
          <p className="text-gray-600">Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="text-red-600 mr-3 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-red-900 font-semibold mb-1">Error al cargar los datos</h3>
            <p className="text-red-700 text-sm">
              {error instanceof Error ? error.message : 'No se pudo cargar la información del cliente'}
            </p>
            <button
              onClick={() => navigate('/clients')}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Volver a la lista de clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4">
        <ol className="flex items-center space-x-2">
          <li>
            <button onClick={() => navigate('/dashboard')} className="hover:text-primary-600">
              Dashboard
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate('/clients')} className="hover:text-primary-600">
              Clientes
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate(`/clients/${id}`)} className="hover:text-primary-600">
              {client.firstName} {client.lastName}
            </button>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Editar</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/clients/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver al perfil
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Cliente</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información de DNI (solo lectura) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <p className="text-gray-900 font-medium">{client.dni}</p>
            <p className="text-xs text-gray-500 mt-1">El DNI no puede ser modificado</p>
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              {...register('firstName')}
              type="text"
              id="firstName"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              {...register('lastName')}
              type="text"
              id="lastName"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (opcional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento (opcional)
            </label>
            <input
              {...register('birthDate')}
              type="date"
              id="birthDate"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>}
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección (opcional)
            </label>
            <input
              {...register('address')}
              type="text"
              id="address"
              maxLength={255}
              placeholder="Ej: Av. Corrientes 1234"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
          </div>

          {/* Ciudad y País en dos columnas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad (opcional)
              </label>
              <input
                {...register('city')}
                type="text"
                id="city"
                maxLength={100}
                placeholder="Ej: Buenos Aires"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                País (opcional)
              </label>
              <input
                {...register('country')}
                type="text"
                id="country"
                maxLength={100}
                placeholder="Ej: Argentina"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
            </div>
          </div>

          {/* Nacionalidad */}
          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
              Nacionalidad (opcional)
            </label>
            <input
              {...register('nationality')}
              type="text"
              id="nationality"
              maxLength={100}
              placeholder="Ej: Argentina"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.nationality ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality.message}</p>}
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              {...register('observations')}
              id="observations"
              rows={4}
              placeholder="Notas adicionales sobre el cliente..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.observations ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.observations && <p className="mt-1 text-sm text-red-600">{errors.observations.message}</p>}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/clients/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={updateMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
