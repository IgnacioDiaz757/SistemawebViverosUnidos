import ListaEmpleados from '@/components/ListaEmpleados';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function BajasPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Asociados Dados de Baja
          </h1>
          <p className="text-lg text-gray-600">
            Historial de asociados que han sido dados de baja de la cooperativa
          </p>
        </div>
        
        <ListaEmpleados tipo="baja" />
      </div>
    </ProtectedRoute>
  );
}
