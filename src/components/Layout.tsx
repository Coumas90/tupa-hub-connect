import { Outlet } from 'react-router-dom';
import { AdaptiveSidebar } from '@/components/navigation/AdaptiveSidebar';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { LocationSwitcher } from './LocationSwitcher';
import { UserMenu } from './UserMenu';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

export function Layout() {
  const { canAccessTenantFeatures } = useEnhancedAuth();

  return (
    <div className="flex h-screen bg-background">
      <AdaptiveSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background border-b">
          <SmartBreadcrumbs />
          
          <div className="flex items-center justify-end px-6 py-2 space-x-4">
            {canAccessTenantFeatures && <LocationSwitcher />}
            <UserMenu />
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}