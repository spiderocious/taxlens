// Centralised icon proxy. The rest of the codebase imports from `@icons`
// (mapped in each app's tsconfig/vite alias) so we can swap the icon source
// in one place — currently lucide-react.
export {
  Home as IconHome,
  ChevronLeft as IconBack,
  ChevronRight as IconForward,
  User as IconUser,
  Search as IconSearch,
  Settings as IconSettings,
  LogOut as IconLogout,
  AlertTriangle as IconAlert,
  Activity as IconActivity,
  Map as IconMap,
  BarChart3 as IconChart,
} from 'lucide-react';
