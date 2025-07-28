import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Coffee,
  BarChart3,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Package,
  Clock,
  GraduationCap,
  Menu,
  X,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
  { name: 'Recetas', href: '/app/recetas', icon: Coffee },
  { name: 'Academia', href: '/app/academia', icon: GraduationCap },
  { name: 'Consumo', href: '/app/consumo', icon: BarChart3 },
  { name: 'Recursos', href: '/app/recursos', icon: FileText },
  { name: 'Mi Equipo', href: '/app/mi-equipo', icon: Users },
  { name: 'Reposición', href: '/app/reposicion', icon: Package },
  { name: 'Barista Pool', href: '/app/barista-pool', icon: Clock },
  { name: 'FAQ', href: '/app/faq', icon: HelpCircle },
  { name: 'Admin POS', href: '/app/admin/integrations', icon: Settings },
  { name: 'Admin Cursos', href: '/app/admin/courses', icon: GraduationCap },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-gradient-primary text-white transition-all duration-300 h-screen sticky top-0 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-secondary" />
              <span className="text-xl font-bold">TUPÁ Hub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white/10 ml-auto"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                "hover:bg-white/10",
                isActive && "bg-secondary shadow-warm"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed && (
          <div className="text-sm text-white/70">
            <p className="font-medium">Café TUPÁ</p>
            <p>Plan Premium</p>
          </div>
        )}
      </div>
    </div>
  );
}