import { useParams } from 'react-router-dom';
import LocationDashboard from '@/components/location/LocationDashboard';

export default function LocationDashboardPage() {
  const { locationId } = useParams<{ locationId: string }>();

  if (!locationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">ID de ubicación no válido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LocationDashboard locationId={locationId} />
    </div>
  );
}