import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    Filter,
    Bed,
    DoorOpen,
    Wrench,
    XCircle,
} from 'lucide-react';
import { listRooms, deleteRoom, type ListRoomsFilters } from '../../api/rooms.api';
import { Can } from '../../components/auth/Can';

/**
 * RoomListPage
 * Componente: Página de lista de habitaciones
 * Responsabilidad: Mostrar lista de habitaciones con filtros y acciones CRUD
 * Sigue: DESIGN_SYSTEM.md y MEJORES_PRACTICAS.md
 */
export default function RoomListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<ListRoomsFilters>({
        onlyActive: true,
    });
    const [showFilters, setShowFilters] = useState(false);

    // Cargar habitaciones
    const { data: rooms, isLoading, error } = useQuery({
        queryKey: ['rooms', filters],
        queryFn: () => listRooms(filters),
    });

    // Mutación para eliminar
    const deleteMutation = useMutation({
        mutationFn: deleteRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        },
    });

    const handleDelete = async (id: number, numeroHabitacion: string) => {
        if (window.confirm(`¿Está seguro de eliminar la habitación ${numeroHabitacion}?`)) {
            try {
                await deleteMutation.mutateAsync(id);
            } catch {
                alert('Error al eliminar la habitación');
            }
        }
    };

    const getEstadoBadgeClass = (estado: string) => {
        switch (estado) {
            case 'AVAILABLE':
                return 'bg-success-100 text-success-700';
            case 'OCCUPIED':
                return 'bg-error-100 text-error-700';
            case 'MAINTENANCE':
                return 'bg-warning-100 text-warning-700';
            case 'OUT_OF_SERVICE':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'AVAILABLE':
                return <DoorOpen className="w-4 h-4" />;
            case 'OCCUPIED':
                return <Bed className="w-4 h-4" />;
            case 'MAINTENANCE':
                return <Wrench className="w-4 h-4" />;
            case 'OUT_OF_SERVICE':
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
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

    const getTipoLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            ESTANDAR: 'Estándar',
            SUITE: 'Suite',
            FAMILIAR: 'Familiar',
        };
        return labels[tipo] || tipo;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                <p>Error al cargar habitaciones: {(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Habitaciones</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona las habitaciones del hotel
                    </p>
                </div>
                <Can perform={['habitaciones.crear']}>
                    <button
                        onClick={() => navigate('/rooms/new')}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Habitación
                    </button>
                </Can>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                    <Filter className="w-5 h-5" />
                    Filtros
                    {showFilters ? <p>▲</p> : <p>▼</p>}
                </button>

                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                value={filters.tipo || ''}
                                onChange={(e) => setFilters({ ...filters, tipo: (e.target.value || undefined) as ListRoomsFilters['tipo'] })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                <option value="ESTANDAR">Estándar</option>
                                <option value="SUITE">Suite</option>
                                <option value="FAMILIAR">Familiar</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={filters.estado || ''}
                                onChange={(e) => setFilters({ ...filters, estado: (e.target.value || undefined) as ListRoomsFilters['estado'] })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                <option value="AVAILABLE">Disponible</option>
                                <option value="OCCUPIED">Ocupada</option>
                                <option value="MAINTENANCE">Mantenimiento</option>
                                <option value="OUT_OF_SERVICE">Fuera de servicio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Capacidad mínima
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={filters.capacidadMinima || ''}
                                onChange={(e) => setFilters({ ...filters, capacidadMinima: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Ej: 2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio máximo
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={filters.precioMaximo || ''}
                                onChange={(e) => setFilters({ ...filters, precioMaximo: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Ej: 200"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de habitaciones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Habitación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Capacidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio/Noche
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rooms && rooms.length > 0 ? (
                                rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {room.numeroHabitacion}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {room.tipoNombre || getTipoLabel(room.tipo)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {room.tipo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(room.estado)}`}>
                                                {getEstadoIcon(room.estado)}
                                                {getEstadoLabel(room.estado)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {room.capacidad} {room.capacidad === 1 ? 'persona' : 'personas'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${room.precioPorNoche.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Can perform={['habitaciones.ver']}>
                                                    <button
                                                        onClick={() => navigate(`/rooms/${room.id}`)}
                                                        className="text-primary-600 hover:text-primary-900"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </Can>
                                                <Can perform={['habitaciones.modificar']}>
                                                    <button
                                                        onClick={() => navigate(`/rooms/${room.id}/edit`)}
                                                        className="text-accent-600 hover:text-accent-900"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </Can>
                                                <Can perform={['habitaciones.eliminar']}>
                                                    <button
                                                        onClick={() => handleDelete(room.id, room.numeroHabitacion)}
                                                        className="text-error-600 hover:text-error-900"
                                                        title="Eliminar"
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </Can>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron habitaciones
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Estadísticas */}
            {rooms && rooms.length > 0 && (
                <div className="text-sm text-gray-600">
                    Mostrando {rooms.length} {rooms.length === 1 ? 'habitación' : 'habitaciones'}
                </div>
            )}
        </div>
    );
}
