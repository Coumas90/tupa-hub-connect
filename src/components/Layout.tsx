import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LocationSwitcher } from './LocationSwitcher';
import { UserMenu } from './UserMenu';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-light flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex justify-between items-center p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <LocationSwitcher />
            <UserMenu />
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}