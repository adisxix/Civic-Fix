import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { useGetModerationQueueQuery, useModerateIssueMutation } from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/shared/StatusBadge';

export default function WardModerationPage() {
  const { data: queueData, isLoading } = useGetModerationQueueQuery();
  const [moderateIssue, { isLoading: isModerating }] = useModerateIssueMutation();

  const flaggedIssues = queueData?.issues || queueData?.data || queueData || [];
  const [actionReason, setActionReason] = useState({});

  const handleAction = async (issueId, action) => {
    try {
      const reason =
        actionReason[issueId] ||
        (action === 'approve' ? 'Content approved by moderator' : 'Flagged content hidden');
      await moderateIssue({
        id: issueId,
        action,
        reason,
      }).unwrap();

      toast.success(action === 'approve' ? 'Content approved' : 'Content hidden/moderated');
    } catch (err) {
      toast.error(err?.data?.detail || 'Moderation action failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">Moderation Queue</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {flaggedIssues.length} items
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review community-flagged issues, inappropriate photos, or abusive text reports.
        </p>
      </div>

      {/* Moderation Items */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : flaggedIssues.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed border-2 border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800">All Clear!</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no flagged or reported issues waiting for moderation.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {flaggedIssues.map((issue) => (
            <Card key={issue.id} className="p-5 border-amber-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{issue.id}</span>
                    <StatusBadge status={issue.status} />
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                      Flag Reason: {issue.flag_reason || 'Inappropriate content reported'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{issue.title}</h3>
                  <p className="text-xs text-slate-600">{issue.description}</p>
                </div>

                {issue.photo_url && (
                  <img
                    src={issue.photo_url}
                    alt="Flagged evidence"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
                <div className="flex-1 w-full sm:w-auto">
                  <Input
                    placeholder="Reason for moderation action..."
                    value={actionReason[issue.id] || ''}
                    onChange={(e) =>
                      setActionReason({ ...actionReason, [issue.id]: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                    onClick={() => handleAction(issue.id, 'approve')}
                    loading={isModerating}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Content
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => handleAction(issue.id, 'reject')}
                    loading={isModerating}
                  >
                    <XCircle className="w-4 h-4" />
                    Hide / Suppress
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
