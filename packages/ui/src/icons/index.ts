// Centralised icon proxy. The rest of the codebase imports from `@icons`
// (mapped in each app's tsconfig/vite alias) so we can swap the icon source
// in one place — currently lucide-react. One family: line, ~1.6 stroke, no emoji.
export {
  // chrome / navigation
  Search as IconSearch,
  ChevronLeft as IconBack,
  ChevronRight as IconForward,
  ArrowRight as IconNext,
  X as IconClose,
  Settings as IconSettings,
  Menu as IconMenu,
  // domain glyphs (TaxLens)
  FileText as IconStatement, // bank statement / document
  Upload as IconUpload,
  Download as IconDownload,
  BarChart3 as IconBands, // band breakdown
  ShieldCheck as IconExempt, // tax-free / exempt slice
  TrendingUp as IconRate, // effective rate / tax-as-income-rises
  Info as IconInfo, // explain / statute note
  Check as IconCheck,
  CheckCircle2 as IconDone,
  AlertTriangle as IconWarn,
  Trash2 as IconClear, // clear all data (critical)
  Sparkles as IconAssist, // AI assist / ask TaxLens
  HelpCircle as IconHelp,
  Pencil as IconEdit,
} from 'lucide-react';
