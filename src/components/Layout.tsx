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
        <header className="bg-background border-b px-4 sm:px-6">
          <SmartBreadcrumbs />
          
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 px-0 py-2">
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