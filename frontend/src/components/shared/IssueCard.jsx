import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { IllustrativeDataBadge } from './IllustrativeDataBadge';
import { SlaChip } from './SlaChip';
import { formatDateRelative, formatDistanceMeters } from '../../lib/format';
import { cn } from '../../lib/cn';

export function IssueCard({ issue, className }) {
  const distance = formatDistanceMeters(issue.distanceM);

  return (
    <Link
      to={`/issues/${issue.id}`}
      className={cn(
        'block bg-white rounded-2xl border border-sage-300 p-5 shadow-xs hover:shadow-md hover:border-forest-600 transition-all text-ink',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="code-chip px-2 py-0.5 text-xs font-bold bg-mist text-forest-800 rounded border border-sage-200">
            {issue.issueCode || `#CF-${String(issue.id).padStart(3, '0')}`}
          </span>
          <CategoryBadge categoryName={issue.categoryName} categoryCode={issue.categoryCode} />
        </div>
        {issue.isSeed && <IllustrativeDataBadge />}
      </div>

      <h3 className="font-bold text-base md:text-lg mb-1.5 line-clamp-2 hover:text-forest-700">
        {issue.title}
      </h3>

      {issue.summary && <p className="text-xs text-moss line-clamp-2 mb-3">{issue.summary}</p>}

      {issue.imageUrl && (
        <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-mist">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sage-200 text-xs">
        <div className="flex items-center gap-2">
          <StatusBadge status={issue.status} />
          <SlaChip slaState={issue.slaState} remainingHours={issue.slaRemainingHours} />
        </div>

        <div className="flex items-center gap-3 text-moss font-medium">
          <span className="flex items-center gap-1 text-forest-800 font-semibold">
            <Users className="w-3.5 h-3.5" />
            {issue.supportersCount} {issue.supportersCount === 1 ? 'supporter' : 'supporters'}
          </span>

          {distance && (
            <span className="flex items-center gap-1 text-moss">
              <MapPin className="w-3.5 h-3.5" />
              {distance}
            </span>
          )}

          <span className="flex items-center gap-1 text-moss">
            <Clock className="w-3.5 h-3.5" />
            {formatDateRelative(issue.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default IssueCard;
