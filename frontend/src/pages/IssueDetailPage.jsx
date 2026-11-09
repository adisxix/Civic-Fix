import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2, AlertTriangle, Layers, Star } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CategoryBadge } from '../components/shared/CategoryBadge';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { SlaChip } from '../components/shared/SlaChip';
import { IllustrativeDataBadge } from '../components/shared/IllustrativeDataBadge';
import { SupportButton } from '../components/shared/SupportButton';
import { ActivityTimeline } from '../components/shared/ActivityTimeline';
import { BeforeAfterSlider } from '../components/shared/BeforeAfterSlider';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  useGetIssueByIdQuery,
  useGetIssueTimelineQuery,
  useVerifyIssueMutation,
  useReopenIssueMutation,
} from '../features/api/civicApi';

export function IssueDetailPage() {
  const { id } = useParams();
  const issueId = Number(id);

  const { data: issueData, isLoading, refetch } = useGetIssueByIdQuery(issueId);
  const { data: timelineData } = useGetIssueTimelineQuery(issueId);

  const [verifyIssue, { isLoading: isVerifying }] = useVerifyIssueMutation();
  const [reopenIssue, { isLoading: isReopening }] = useReopenIssueMutation();

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [rating, setRating] = useState(5);
  const [verifyComment, setVerifyComment] = useState('');

  const issue = issueData?.data;
  const timeline = timelineData?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Issue Not Found</h2>
        <Link to="/issues" className="text-xs text-forest-700 underline font-semibold">
          Return to feed
        </Link>
      </div>
    );
  }

  // Find before and after photos
  const beforePhoto = issue.reports?.[0]?.imageUrl || issue.imageUrl;
  const afterPhoto = issue.evidence?.find((e) => e.kind === 'after')?.url;

  const handleConfirmFix = async () => {
    try {
      await verifyIssue({ id: issueId, rating, comment: verifyComment }).unwrap();
      toast.success('Thank you! Fix confirmed and issue marked resolved.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.error?.message || 'Failed to verify fix');
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toast.error('Please specify why this issue is not fixed.');
      return;
    }

    const formData = new FormData();
    formData.append('reason', reopenReason);

    try {
      await reopenIssue({ id: issueId, formData }).unwrap();
      toast.success('Issue flagged as not resolved. Ward team has been notified.');
      setIsReopenModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error?.message || 'Failed to reopen issue');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-3xl border border-sage-300 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="code-chip px-2.5 py-1 text-xs font-bold bg-mist text-forest-800 rounded-md border border-sage-200">
              {issue.issueCode}
            </span>
            <CategoryBadge categoryName={issue.categoryName} categoryCode={issue.categoryCode} />
            <PriorityBadge priority={issue.priority} />
          </div>
          {issue.isSeed && <IllustrativeDataBadge />}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight">
          {issue.title}
        </h1>

        {issue.summary && (
          <p className="text-sm text-moss leading-relaxed bg-mist/60 p-3.5 rounded-xl border border-sage-200">
            {issue.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <StatusBadge status={issue.status} />
          <SlaChip slaState={issue.slaState} remainingHours={issue.slaRemainingHours} />
          <span className="px-3 py-1 bg-mist text-forest-800 rounded-full border border-sage-200 font-medium">
            Ward 14 (Central)
          </span>
          <span className="px-3 py-1 bg-mist text-forest-800 rounded-full border border-sage-200 font-medium">
            Dept: {issue.departmentName}
          </span>
          {issue.assignedToName && (
            <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200 font-medium">
              Assigned: {issue.assignedToName}
            </span>
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-sage-200">
          <div className="flex items-center gap-4 text-xs font-medium text-moss">
            <span className="flex items-center gap-1.5 font-bold text-forest-800">
              <Users className="w-4 h-4" /> {issue.supportersCount} Supporters
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> {issue.reportsCount} Reports in cluster
            </span>
          </div>

          <SupportButton
            issueId={issue.id}
            hasSupported={issue.hasSupported}
            supportersCount={issue.supportersCount}
          />
        </div>
      </div>

      {/* Verification Panel per SPEC 6.1 & 14.5 */}
      {issue.canVerify && (
        <div className="bg-amber-50 rounded-2xl border-2 border-signal p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-signal font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5" /> Citizen Verification Requested
          </div>

          <h3 className="text-lg font-bold text-ink">
            The ward team marked this issue as fixed. Has the problem been resolved?
          </h3>
          <p className="text-xs text-moss">
            Because you are linked to this neighbourhood issue, your verification is required before
            permanent closure.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-forest-800">
              Rate the work:
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-4 h-4 ${star <= rating ? 'fill-amber-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Optional comment on the fix..."
              value={verifyComment}
              onChange={(e) => setVerifyComment(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-amber-300 bg-white"
              rows={2}
            />

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" disabled={isVerifying} onClick={handleConfirmFix}>
                <CheckCircle2 className="w-4 h-4 text-lime" /> Yes, it's fixed (Confirm Closure)
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsReopenModalOpen(true)}
                className="border-danger text-danger hover:bg-red-50"
              >
                No, it's not resolved (Dispute)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen button for resolved issues inside 14-day window */}
      {issue.canReopen && issue.status === 'resolved' && (
        <div className="bg-white p-4 rounded-2xl border border-sage-300 flex items-center justify-between">
          <div className="text-xs text-moss">
            Fixed recently? Within 14 days of closure, you can reopen this ticket if the problem
            reappears.
          </div>
          <Button variant="danger" size="sm" onClick={() => setIsReopenModalOpen(true)}>
            Reopen Issue
          </Button>
        </div>
      )}

      {/* Visual Proof / Before & After Slider */}
      {beforePhoto && (
        <section className="bg-white rounded-3xl border border-sage-300 p-6 space-y-3">
          <h3 className="font-bold text-sm text-forest-800 uppercase tracking-wider">
            {afterPhoto ? 'Before & After Work Proof' : 'Initial Report Photo'}
          </h3>
          <BeforeAfterSlider beforeUrl={beforePhoto} afterUrl={afterPhoto} />
        </section>
      )}

      {/* Activity Timeline */}
      <section className="bg-white rounded-3xl border border-sage-300 p-6 space-y-4">
        <h3 className="font-bold text-sm text-forest-800 uppercase tracking-wider">
          Official Action Timeline
        </h3>
        <ActivityTimeline items={timeline} />
      </section>

      {/* Reopen / Dispute Modal */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Flag Issue As Not Resolved"
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4">
          <p className="text-xs text-moss">
            Please provide details so ward officers know why the fix was incomplete or unsuccessful.
          </p>

          <div>
            <label className="block text-xs font-semibold text-forest-800 mb-1">
              Reason for Dispute / Reopening *
            </label>
            <textarea
              required
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. The pothole was only filled with loose gravel which washed away..."
              className="w-full text-xs p-3 rounded-xl border border-sage-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={isReopening}>
              {isReopening ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default IssueDetailPage;
