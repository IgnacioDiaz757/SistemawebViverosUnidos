import ListaEmpleados from '@/components/ListaEmpleados';
import EstadisticasDashboard from '@/components/EstadisticasDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Gestión de Asociados
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona asociados activos, registra nuevos miembros y controla las bajas
          </p>
        </div>
        
        <EstadisticasDashboard />
        
        <ListaEmpleados tipo="activos" />
      </div>
    </ProtectedRoute>
  );
}
