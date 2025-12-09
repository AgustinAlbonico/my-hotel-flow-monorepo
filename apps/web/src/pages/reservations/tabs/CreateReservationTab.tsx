/**
 * Create Reservation Tab
 * Tab para crear nuevas reservas
 * Adaptado de CreateReservationWizard.tsx
 */
import React from 'react';
import CreateReservationWizard from '../CreateReservationWizard';

export const CreateReservationTab: React.FC = () => {
  // Reutilizamos el wizard completo pero sin el layout externo
  // El wizard ya tiene toda la lógica necesaria
  return (
    <div className="-m-6">
      <CreateReservationWizard />
    </div>
  );
};

export default CreateReservationTab;
