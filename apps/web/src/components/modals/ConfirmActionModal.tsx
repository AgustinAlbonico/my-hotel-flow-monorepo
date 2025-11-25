/**
 * ConfirmActionModal
 * Modal reutilizable para confirmar acciones (check-in, check-out, eliminación, etc.)
 * Reduce duplicación de estructura (header, icono, cuerpo, footer).
 */
import React from 'react';
import { Modal } from '../ui/Modal';
import { Loader2 } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  children?: React.ReactNode; // Sección central con detalles específicos
  note?: string; // Texto informativo inferior opcional
  isLoading?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
  layoutSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  icon,
  description,
  children,
  note,
  isLoading = false,
  disabled = false,
  errorMessage = null,
  layoutSize = 'md',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={layoutSize}
    >
      <div className="space-y-6">
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-error-50 border border-error-200">
            <span className="text-sm text-error-700">{errorMessage}</span>
          </div>
        )}

        {/* Contenido específico inyectado */}
        {children && <div className="space-y-4">{children}</div>}

        {note && (
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
            {note}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || disabled}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {icon}
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;