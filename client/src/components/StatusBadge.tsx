import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
  customLabel,
}) => {
  const normalized = (status || '').toUpperCase().trim();

  // Map known status strings to color schemes
  const getBadgeStyle = (val: string): { bg: string; text: string; border: string; dot: string } => {
    switch (val) {
      // Success states
      case 'OPEN_FOR_APPLICATION':
      case 'OPEN':
      case 'ACTIVE':
      case 'PAID':
      case 'APPROVED':
      case 'ENROLLED':
      case 'FINANCIALLY_CLEARED':
      case 'PRESENT':
      case 'PUBLISHED':
      case 'COMPLETED':
      case 'SENT':
      case 'ACQUIRED':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200/80',
          dot: 'bg-emerald-500',
        };

      // Warning / Pending states
      case 'ALMOST_FULL':
      case 'UPCOMING':
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'ASSESSMENT_PENDING':
      case 'PLACEMENT_PENDING':
      case 'OFFERED':
      case 'ISSUED':
      case 'PARTIALLY_PAID':
      case 'LATE':
      case 'IN_PROGRESS':
      case 'IN_REVIEW':
      case 'PENDING_REVIEW':
      case 'CHANGES_REQUESTED':
      case 'POLICY_PENDING':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200/80',
          dot: 'bg-amber-500',
        };

      // Error / Rejected / Full states
      case 'FULL':
      case 'REJECTED':
      case 'FAILED':
      case 'CANCELLED':
      case 'ABSENT':
      case 'SUSPENDED':
      case 'DEACTIVATED':
      case 'OVERDUE':
      case 'DECLINED':
      case 'WITHDRAWN':
      case 'EXPIRED':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200/80',
          dot: 'bg-rose-500',
        };

      // Neutral / Informational states
      case 'DRAFT':
      case 'ARCHIVED':
      case 'CLOSED':
      case 'SUBMITTED':
      case 'ASSESSED':
      case 'PLACED':
      case 'EXCUSED':
      case 'UNPAID':
      case 'REVISED':
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getBadgeStyle(normalized);
  const displayLabel = customLabel || normalized.replace(/_/g, ' ');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-wide uppercase rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
