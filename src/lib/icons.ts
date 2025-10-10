// Icon preferences: Radix icons first, Lucide as fallback
import * as RadixIcons from '@radix-ui/react-icons';
import * as LucideIcons from 'lucide-react';

// Export commonly used icons with Radix preference
export const Icons = {
  // Navigation & UI
  Dashboard: RadixIcons.DashboardIcon,
  Settings: RadixIcons.GearIcon,
  Home: RadixIcons.HomeIcon,
  User: RadixIcons.PersonIcon,
  Users: RadixIcons.PersonIcon, // Same as User for consistency

  // Actions
  Plus: RadixIcons.PlusIcon,
  Cross: RadixIcons.Cross2Icon,
  Check: RadixIcons.CheckIcon,
  Menu: RadixIcons.HamburgerMenuIcon,
  ChevronRight: RadixIcons.ChevronRightIcon,
  ChevronDown: RadixIcons.ChevronDownIcon,
  ChevronLeft: RadixIcons.ChevronLeftIcon,
  ChevronUp: RadixIcons.ChevronUpIcon,

  // Content
  FileText: RadixIcons.FileTextIcon,
  Image: RadixIcons.ImageIcon,
  Download: RadixIcons.DownloadIcon,
  Upload: RadixIcons.UploadIcon,
  Copy: RadixIcons.CopyIcon,

  // States
  Loading: RadixIcons.UpdateIcon,
  Search: RadixIcons.MagnifyingGlassIcon,
  Filter: RadixIcons.MixerHorizontalIcon,
  Sort: RadixIcons.CaretSortIcon,

  // Theme
  Sun: RadixIcons.SunIcon,
  Moon: RadixIcons.MoonIcon,

  // Password visibility
  Eye: RadixIcons.EyeOpenIcon,
  EyeOff: RadixIcons.EyeClosedIcon,

  // System
  ExternalLink: RadixIcons.ExternalLinkIcon,
  Link: RadixIcons.Link2Icon,
  Trash: RadixIcons.TrashIcon,
  Edit: RadixIcons.Pencil1Icon,

  // Fallback to Lucide for icons not available in Radix
  Trophy: LucideIcons.Trophy,
  Package: LucideIcons.Package,
  Database: LucideIcons.Database,
  Tag: LucideIcons.Tag,
  Shield: LucideIcons.Shield,
  BarChart3: LucideIcons.BarChart3,
  LogOut: LucideIcons.LogOut,
  LogIn: LucideIcons.LogIn,

  // All Radix icons (for comprehensive access)
  Radix: RadixIcons,

  // All Lucide icons (for fallback)
  Lucide: LucideIcons,
} as const;

// Type for icon components
export type IconComponent = React.ComponentType<{ className?: string; [key: string]: unknown }>;

// Helper function to get an icon with fallback
export const getIcon = (
  radixIcon?: keyof typeof RadixIcons,
  lucideIcon?: keyof typeof LucideIcons,
  fallback: IconComponent = RadixIcons.QuestionMarkCircledIcon
): IconComponent => {
  if (radixIcon && RadixIcons[radixIcon]) {
    return RadixIcons[radixIcon] as IconComponent;
  }
  if (lucideIcon && LucideIcons[lucideIcon]) {
    return LucideIcons[lucideIcon] as IconComponent;
  }
  return fallback;
};