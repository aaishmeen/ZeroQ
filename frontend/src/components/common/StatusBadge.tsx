import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'sm',
}) => {
  if (!status) return null;

  const st = status.trim().toUpperCase();

  let colors = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (st) {
    case 'APPROVED':
    case 'RESOLVED':
    case 'ACTIVE':
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      Icon = CheckCircle2;
      break;
    case 'PENDING':
    case 'IN_REVIEW':
    case 'OPEN':
      colors = 'bg-amber-50 text-amber-700 border-amber-200/80';
      Icon = Clock;
      break;
    case 'REJECTED':
    case 'CANCELLED':
    case 'CLOSED':
      colors = 'bg-red-50 text-red-700 border-red-200/80';
      Icon = XCircle;
      break;
    case 'UPCOMING':
      colors = 'bg-blue-50 text-blue-700 border-blue-200/80';
      Icon = Sparkles;
      break;
    case 'COMPLETED':
      colors = 'bg-slate-100 text-slate-700 border-slate-300';
      Icon = Check;
      break;
    default:
      colors = 'bg-slate-50 text-slate-700 border-slate-200';
      Icon = AlertTriangle;
      break;
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${colors} ${padding} ${className}`}
    >
      <Icon className={`${iconSize} shrink-0`} />
      <span>{status}</span>
    </span>
  );
};
