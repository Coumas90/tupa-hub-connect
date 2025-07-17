import Dashboard from './Dashboard';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';

export default function Index() {
  return (
    <ModuleAccessGuard module="Inicio" requiredRole="usuario">
      <Dashboard />
    </ModuleAccessGuard>
  );
}