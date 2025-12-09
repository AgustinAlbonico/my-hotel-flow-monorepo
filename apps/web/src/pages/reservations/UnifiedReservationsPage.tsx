/**
 * Unified Reservations Page
 * Vista unificada para todas las operaciones de reservas
 * Integra: Listado, Crear, Check-in, Check-out y Gestión
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  LogIn,
  LogOut,
  List,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

// Tabs components
import {
  ReservationsListTab,
  CreateReservationTab,
  CheckInTab,
  CheckOutTab,
} from './tabs';

type TabType = 'list' | 'create' | 'checkin' | 'checkout';

interface TabConfig {
  id: TabType;
  label: string;
  icon: LucideIcon;
  requiredPermission?: string;
}

const TABS: TabConfig[] = [
  {
    id: 'list',
    label: 'Reservas',
    icon: List,
    requiredPermission: 'reservas.listar',
  },
  {
    id: 'create',
    label: 'Crear Reserva',
    icon: Plus,
    requiredPermission: 'reservas.crear',
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: LogIn,
    requiredPermission: 'reservas.checkin',
  },
  {
    id: 'checkout',
    label: 'Check-out',
    icon: LogOut,
    requiredPermission: 'reservas.checkout',
  },
];

export const UnifiedReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'list'
  const initialTab = (searchParams.get('tab') as TabType) || 'list';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Handle tab change
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <ReservationsListTab />;
      case 'create':
        return <CreateReservationTab />;
      case 'checkin':
        return <CheckInTab />;
      case 'checkout':
        return <CheckOutTab />;
      default:
        return <ReservationsListTab />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <button onClick={() => navigate('/')} className="hover:text-primary-600 dark:hover:text-primary-400">
          Inicio
        </button>
        <ChevronRight className="inline mx-2" size={16} />
        <span className="text-gray-900 dark:text-gray-100 font-medium">Gestión de Reservas</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-primary-600 dark:text-primary-400" size={40} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Gestión de Reservas</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Sistema completo para gestionar reservas, check-in y check-out del hotel
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm border border-gray-200 dark:border-gray-700 border-b-0">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-all duration-200
                  ${
                    isActive
                      ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/30'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UnifiedReservationsPage;
