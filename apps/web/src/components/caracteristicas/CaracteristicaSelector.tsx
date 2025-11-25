import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, X, Check } from 'lucide-react';
import { listCaracteristicas } from '../../api/caracteristicas.api';

interface CaracteristicaSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
}

/**
 * CaracteristicaSelector
 * Componente: Selector de múltiples características
 * Responsabilidad: Permitir buscar y seleccionar características para asociar a un tipo de habitación
 */
export default function CaracteristicaSelector({
  selectedIds,
  onChange,
  error,
}: CaracteristicaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Cargar características activas
  const { data: caracteristicas } = useQuery({
    queryKey: ['caracteristicas', true],
    queryFn: () => listCaracteristicas(true),
  });

  // Filtrar características por búsqueda
  const filteredCaracteristicas = caracteristicas?.filter(
    (car) =>
      car.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.descripcion && car.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener características seleccionadas
  const selectedCaracteristicas = caracteristicas?.filter((car) =>
    selectedIds.includes(car.id)
  ) || [];

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.caracteristica-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="caracteristica-selector">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Características
      </label>

      {/* Características seleccionadas */}
      {selectedCaracteristicas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCaracteristicas.map((car) => (
            <div
              key={car.id}
              className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-sm"
            >
              <Tag className="w-3 h-3" />
              <span>{car.nombre}</span>
              <button
                type="button"
                onClick={() => handleRemove(car.id)}
                className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Campo de búsqueda */}
      <div className="relative">
        <div
          className={`border ${error ? 'border-error-300' : 'border-gray-300'} rounded-lg`}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar características..."
              className="flex-1 outline-none text-sm"
            />
          </div>
        </div>

        {/* Dropdown de características */}
        {isOpen && filteredCaracteristicas && filteredCaracteristicas.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCaracteristicas.map((car) => {
              const isSelected = selectedIds.includes(car.id);
              return (
                <div
                  key={car.id}
                  onClick={() => handleToggle(car.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-50 hover:bg-primary-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {car.nombre}
                      </p>
                      {car.descripcion && (
                        <p className="text-xs text-gray-500 truncate">
                          {car.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {isOpen && filteredCaracteristicas && filteredCaracteristicas.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              No se encontraron características
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-error-600 text-sm mt-1">{error}</p>
      )}

      <p className="text-gray-500 text-xs mt-1">
        {selectedCaracteristicas.length === 0
          ? 'No hay características seleccionadas'
          : `${selectedCaracteristicas.length} característica${selectedCaracteristicas.length !== 1 ? 's' : ''} seleccionada${selectedCaracteristicas.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
}
