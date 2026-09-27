import { Check, ClipboardList, Clock, FileCheck, Thermometer, type LucideIcon } from 'lucide-react';
import type { HaccpType } from '@/shared/domain/constants';

export const HACCP_ICONS: Record<HaccpType, LucideIcon> = {
  cleaning: ClipboardList,
  temperature: Thermometer,
  delivery: FileCheck,
  traceability: Clock,
  checklist: Check,
};
