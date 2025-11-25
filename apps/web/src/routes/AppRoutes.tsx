/**
 * App Routes - Configuración de rutas de la aplicación
 * Siguiendo MEJORES_PRACTICAS.md - Estructura de rutas
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { RecoverPasswordPage } from '@/pages/auth/RecoverPasswordPage';
import { ConfirmRecoverPasswordPage } from '@/pages/auth/ConfirmRecoverPasswordPage';

// Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

// Users
import { UsersListPage } from '@/pages/users/UsersListPage';
import { UserFormPage } from '@/pages/users/UserFormPage';
import { UserPermissionsPage } from '@/pages/users/UserPermissionsPage';
 
// Groups
import { GroupsListPage } from '@/pages/groups/GroupsListPage';
import { GroupFormPage } from '@/pages/groups/GroupFormPage';
import { GroupActionsPage } from '@/pages/groups/GroupActionsPage';
import { GroupActionsViewPage } from '@/pages/groups/GroupActionsViewPage';
import { GroupChildrenPage } from '@/pages/groups/GroupChildrenPage';

// Actions
import { ActionsListPage } from '@/pages/actions/ActionsListPage';
import { ActionFormPage } from '@/pages/actions/ActionFormPage';

// Reservations
import { ReservationManagementDashboard } from '@/pages/reservations/ReservationManagementDashboard';
import CreateReservationWizard from '@/pages/reservations/CreateReservationWizard';
import { ActiveReservationsPage } from '@/pages/reservations/ActiveReservationsPage';
import { CheckInPage } from '@/pages/reservations/CheckInPage';
import CancelReservationPage from '@/pages/reservations/CancelReservationPage';
import ModifyReservationPage from '@/pages/reservations/ModifyReservationPage';
import ReservationsReportPage from '@/pages/reservations/ReservationsReportPage';
import DailyOccupancyPage from '@/pages/reservations/DailyOccupancyPage';
import ReservationsSearchPage from '@/pages/reservations/ReservationsSearchPage';

// Clients
import CreateClientProfile from '@/pages/clients/CreateClientProfile';
import ClientsListPage from '@/pages/clients/ClientsListPage';
import ClientProfilePage from '@/pages/clients/ClientProfilePage';
import EditClientPage from '@/pages/clients/EditClientPage';

// Rooms
import RoomListPage from '@/pages/rooms/RoomListPage';
import RoomFormPage from '@/pages/rooms/RoomFormPage';
import RoomDetailPage from '@/pages/rooms/RoomDetailPage';

// Room Types
import { RoomTypesListPage } from '@/pages/room-types/RoomTypesListPage';
import { RoomTypeFormPage } from '@/pages/room-types/RoomTypeFormPage';

// Características
import CaracteristicasPage from '@/pages/caracteristicas/CaracteristicasPage';

// Billing & Invoices
import { InvoicesPage } from '@/pages/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import InvoiceReceiptPage from '@/pages/InvoiceReceiptPage';
import { AccountStatementPage } from '@/pages/AccountStatementPage';

// Error Pages
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Ruta raíz - redirigir a dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Rutas públicas de autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/recover" element={<RecoverPasswordPage />} />
      <Route path="/auth/recover/confirm" element={<ConfirmRecoverPasswordPage />} />
      
      {/* Rutas de error */}
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Rutas protegidas - Solo autenticación requerida */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auth/change-password" element={<ChangePasswordPage />} />
      </Route>
        
      {/* Rutas de usuarios - Requiere permisos de usuarios */}
      <Route element={<ProtectedRoute requiredPermissions={['config.usuarios.listar']} />}>
        <Route path="/users" element={<UsersListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.usuarios.crear']} />}>
        <Route path="/users/create" element={<UserFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.usuarios.modificar']} />}>
        <Route path="/users/:id/edit" element={<UserFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.usuarios.asignarGrupos', 'config.usuarios.asignarAcciones']} requireAll={false} />}>
        <Route path="/users/:id/permissions" element={<UserPermissionsPage />} />
      </Route>

      {/* Rutas de grupos - Requiere permisos de grupos */}
      <Route element={<ProtectedRoute requiredPermissions={['config.grupos.listar']} />}>
        <Route path="/groups" element={<GroupsListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.grupos.crear']} />}>
        <Route path="/groups/create" element={<GroupFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.grupos.modificar']} />}>
        <Route path="/groups/:id/edit" element={<GroupFormPage />} />
      </Route>
      {/* Vista de solo lectura de acciones - solo requiere autenticación */}
      <Route element={<ProtectedRoute />}>
        <Route path="/groups/:id/actions/view" element={<GroupActionsViewPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.grupos.asignarAcciones']} />}>
        <Route path="/groups/:id/actions" element={<GroupActionsPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.grupos.asignarHijos']} />}>
        <Route path="/groups/:id/children" element={<GroupChildrenPage />} />
      </Route>

      {/* Rutas de acciones - Requiere permisos de acciones */}
      <Route element={<ProtectedRoute requiredPermissions={['config.acciones.listar']} />}>
        <Route path="/actions" element={<ActionsListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.acciones.crear']} />}>
        <Route path="/actions/create" element={<ActionFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['config.acciones.modificar']} />}>
        <Route path="/actions/:id/edit" element={<ActionFormPage />} />
      </Route>

      {/* Rutas de reservas - Requiere permisos de reservas */}
      <Route element={<ProtectedRoute requiredPermissions={['reservas.listar']} />}>
        <Route path="/reservations" element={<ReservationManagementDashboard />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.listar']} />}>
        <Route path="/reservations/search" element={<ReservationsSearchPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.crear']} />}>
        <Route path="/reservations/create" element={<CreateReservationWizard />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.checkin']} />}>
        <Route path="/reservations/checkin" element={<CheckInPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.checkout']} />}>
        <Route path="/reservations/checkout" element={<ActiveReservationsPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.cancelar']} />}>
        <Route path="/reservations/cancel" element={<CancelReservationPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.modificar']} />}>
        <Route path="/reservations/modify" element={<ModifyReservationPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['reservas.listar']} />}>
        <Route path="/reservations/report" element={<ReservationsReportPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.listar']} />}>
        <Route path="/reservations/occupancy" element={<DailyOccupancyPage />} />
      </Route>

      {/* Rutas de clientes - Requiere permisos de clientes */}
      <Route element={<ProtectedRoute requiredPermissions={['clientes.listar']} />}>
        <Route path="/clients" element={<ClientsListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['clientes.crear']} />}>
        <Route path="/clients/create" element={<CreateClientProfile />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['clientes.ver']} />}>
        <Route path="/clients/:id" element={<ClientProfilePage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['clientes.modificar']} />}>
        <Route path="/clients/:id/edit" element={<EditClientPage />} />
      </Route>

      {/* Habitaciones - Rutas de Room Types */}
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.listar']} />}>
        <Route path="/room-types" element={<RoomTypesListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.crear']} />}>
        <Route path="/room-types/create" element={<RoomTypeFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.modificar']} />}>
        <Route path="/room-types/edit/:id" element={<RoomTypeFormPage />} />
      </Route>

      {/* Habitaciones - Rutas de Rooms */}
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.listar']} />}>
        <Route path="/rooms" element={<RoomListPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.crear']} />}>
        <Route path="/rooms/new" element={<RoomFormPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.ver']} />}>
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.modificar']} />}>
        <Route path="/rooms/:id/edit" element={<RoomFormPage />} />
      </Route>

      {/* Características - Gestión de características para tipos de habitación */}
      <Route element={<ProtectedRoute requiredPermissions={['habitaciones.listar']} />}>
        <Route path="/caracteristicas" element={<CaracteristicasPage />} />
      </Route>

      {/* Facturas - Rutas de facturación y pagos */}
      <Route element={<ProtectedRoute requiredPermissions={['facturas.ver']} />}>
        <Route path="/invoices" element={<InvoicesPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['facturas.ver']} />}>
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredPermissions={['facturas.ver']} />}>
        <Route path="/invoices/:id/receipt" element={<InvoiceReceiptPage />} />
      </Route>

      {/* Estado de Cuenta - Cuenta corriente del cliente */}
      <Route element={<ProtectedRoute requiredPermissions={['clientes.ver']} />}>
        <Route path="/account-statement/:clientId" element={<AccountStatementPage />} />
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

// Página 404 simple
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
        <a href="/dashboard" className="btn-primary">
          Volver al Dashboard
        </a>
      </div>
    </div>
  );
};
