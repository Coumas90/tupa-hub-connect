import { useParams } from 'react-router-dom';
import CafeOwnerDashboard from '@/components/cafe/CafeOwnerDashboard';

export default function CafeDashboard() {
  const { cafeId } = useParams<{ cafeId: string }>();

  if (!cafeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">ID de café no válido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CafeOwnerDashboard cafeId={cafeId} />
    </div>
  );
}