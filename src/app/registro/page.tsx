import FormularioEmpleado from '@/components/FormularioEmpleado';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function RegistroPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registrar Nuevo Asociado
          </h1>
          <p className="text-lg text-gray-600">
            Complete todos los datos del nuevo asociado de la cooperativa
          </p>
        </div>
        
        <FormularioEmpleado />
      </div>
    </ProtectedRoute>
  );
}
