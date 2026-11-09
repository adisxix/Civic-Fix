import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Sparkles,
  UserCheck,
  MessageSquare,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  useGetWardIssueQuery,
  useGetMetaQuery,
  useGetWardTeamQuery,
  useAssignIssueMutation,
  useUpdateWardStatusMutation,
  usePostWardUpdateMutation,
  useUploadWardEvidenceMutation,
  useRegenerateAiSummaryMutation,
} from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import SlaChip from '../../components/shared/SlaChip';
import BeforeAfterSlider from '../../components/shared/BeforeAfterSlider';
import ActivityTimeline from '../../components/shared/ActivityTimeline';

export default function WardWorkspacePage() {
  const { id } = useParams();
  const issueId = Number(id);

  const { data: issueData, isLoading } = useGetWardIssueQuery(issueId);
  const { data: meta } = useGetMetaQuery();
  const { data: teamData } = useGetWardTeamQuery();

  const [assignIssue, { isLoading: isAssigning }] = useAssignIssueMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateWardStatusMutation();
  const [postUpdate, { isLoading: isPostingUpdate }] = usePostWardUpdateMutation();
  const [uploadEvidence, { isLoading: isUploadingEvidence }] = useUploadWardEvidenceMutation();
  const [regenerateAi, { isLoading: isRegeneratingAi }] = useRegenerateAiSummaryMutation();

  const issue = issueData?.data || issueData;

  // Assignment Form State
  const [assigneeId, setAssigneeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assignPriority, setAssignPriority] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Status Change State
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Work Note State
  const [workNoteText, setWorkNoteText] = useState('');
  const [workNoteVisibility, setWorkNoteVisibility] = useState('public');

  // Evidence Upload State
  const [evidenceKind, setEvidenceKind] = useState('after');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceCaption, setEvidenceCaption] = useState('');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading issue triage workspace #{issueId}...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Issue Not Found</h2>
        <p className="text-slate-500 text-xs mt-1">
          Issue #{issueId} could not be loaded or belongs to a different ward.
        </p>
        <div className="mt-4">
          <Link to="/ward/queue">
            <Button variant="primary" size="sm">
              Back to Ward Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Departments & Team members
  const departments = meta?.departments || [];
  const teamMembers = teamData?.data || teamData || [];

  const deptOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const teamOptions = teamMembers.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.role?.replace('_', ' ') || 'Staff'})`,
  }));

  // Handle Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!departmentId) {
      toast.error('Please select a department');
      return;
    }

    try {
      await assignIssue({
        id: issueId,
        category_id: issue.category_id || issue.categoryId || 1,
        department_id: Number(departmentId),
        assignee_id: assigneeId ? Number(assigneeId) : null,
        priority: assignPriority || issue.priority || 'P3',
        note: assignNote || 'Assigned by ward administrator',
      }).unwrap();

      toast.success('Assignment updated successfully!');
      setAssignNote('');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to update assignment');
    }
  };

  // Handle Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus) {
      toast.error('Select a target status');
      return;
    }

    try {
      await updateStatus({
        id: issueId,
        to_status: targetStatus,
        note: statusNote || `Status changed to ${targetStatus}`,
      }).unwrap();

      toast.success(`Status updated to ${targetStatus.replace('_', ' ')}`);
      setTargetStatus('');
      setStatusNote('');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to update status');
    }
  };

  // Handle Work Note Post
  const handleWorkNoteSubmit = async (e) => {
    e.preventDefault();
    if (!workNoteText.trim()) return;

    try {
      await postUpdate({
        id: issueId,
        note: workNoteText,
        visibility: workNoteVisibility,
      }).unwrap();

      toast.success('Update note logged to timeline');
      setWorkNoteText('');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to post note');
    }
  };

  // Handle Evidence Upload
  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      toast.error('Please choose an evidence image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('kind', evidenceKind);
      formData.append('image', evidenceFile);
      if (evidenceCaption) formData.append('caption', evidenceCaption);

      await uploadEvidence({ id: issueId, formData }).unwrap();
      toast.success('Evidence photo uploaded successfully!');
      setEvidenceFile(null);
      setEvidenceCaption('');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to upload evidence');
    }
  };

  // Handle AI Summary Regeneration
  const handleRegenerateAi = async () => {
    try {
      await regenerateAi(issueId).unwrap();
      toast.success('AI summary refreshed from latest cluster reports!');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to regenerate AI summary');
    }
  };

  // Extract photos for BeforeAfterSlider
  const evidenceList = issue.evidence || [];
  const beforePhoto = evidenceList.find((e) => e.kind === 'before')?.url || issue.photo_url || null;
  const afterPhoto = evidenceList.find((e) => e.kind === 'after')?.url || null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Back Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/ward/queue"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                #{issue.issue_code || `CF-${issue.id}`}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <SlaChip slaState={issue.sla_state} hoursRemaining={issue.sla_hours_remaining} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{issue.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Ward:{' '}
            <strong className="text-slate-800">{issue.ward_name || `Ward ${issue.ward_id}`}</strong>
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Issue Context & Evidence (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Cluster Summary Card */}
          <Card className="p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-indigo-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-900">Gemini AI Problem Synthesis</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateAi}
                loading={isRegeneratingAi}
                className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-100/60"
              >
                Regenerate AI
              </Button>
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed font-normal">
              {issue.ai_summary || issue.description || 'AI synthesis pending.'}
            </p>
          </Card>

          {/* Evidence Photos: Before & After comparison */}
          {beforePhoto && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Field Repair Proof (Before & After)
              </h3>
              <BeforeAfterSlider
                beforeImage={beforePhoto}
                afterImage={afterPhoto}
                beforeLabel="Citizen / Initial Report"
                afterLabel={
                  afterPhoto ? 'Crew Repair Proof' : 'Work In Progress (No After Photo Yet)'
                }
              />
            </Card>
          )}

          {/* Cluster Reports (All citizen reports attached to this issue) */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Citizen Cluster Reports ({issue.reports?.length || 1})
              </h3>
              <span className="text-xs text-slate-400">Merged by proximity & verification</span>
            </div>

            <div className="space-y-3">
              {(issue.reports || [issue]).map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Report #{rep.id || rep.report_id || idx + 1}
                    </span>
                    <span>{new Date(rep.created_at || issue.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800">{rep.description}</p>
                  {rep.photo_url && (
                    <img
                      src={rep.photo_url}
                      alt="Citizen report evidence"
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200 mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Full Audit Timeline</h3>
            <ActivityTimeline updates={issue.timeline || []} />
          </Card>
        </div>

        {/* RIGHT COLUMN: Officer & Crew Action Panels */}
        <div className="space-y-6">
          {/* Action 1: Status Lifecycle Transition */}
          <Card className="p-5 space-y-4 border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Lifecycle Transition</span>
            </div>
            <p className="text-xs text-slate-500">
              Current status:{' '}
              <strong className="text-slate-800 capitalize">
                {issue.status?.replace('_', ' ')}
              </strong>
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <Select
                label="Target Status"
                placeholder="Choose next status"
                options={[
                  { value: 'acknowledged', label: 'Acknowledge Issue' },
                  { value: 'assigned', label: 'Assign to Crew' },
                  { value: 'in_progress', label: 'Mark In Progress' },
                  {
                    value: 'resolved_pending_verification',
                    label: 'Resolve (Pending Verification)',
                  },
                  { value: 'closed_resolved', label: 'Force Close / Verified' },
                  { value: 'rejected', label: 'Reject / Not Feasible' },
                ]}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
              />

              <Input
                label="Transition Reason / Note"
                placeholder="Brief reason for state change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                loading={isUpdatingStatus}
              >
                Execute Status Change
              </Button>
            </form>
          </Card>

          {/* Action 2: Assign Department & Worker */}
          <Card className="p-5 space-y-4 border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Dispatch & Assignee</span>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <Select
                label="Responsible Department"
                placeholder="Select department"
                options={deptOptions}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              />

              <Select
                label="Field Worker / Lead"
                placeholder="Assign worker"
                options={teamOptions}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />

              <Select
                label="Priority Override"
                placeholder="Keep Current Priority"
                options={[
                  { value: 'P1', label: 'P1 - Critical (24h)' },
                  { value: 'P2', label: 'P2 - High (48h)' },
                  { value: 'P3', label: 'P3 - Medium (72h)' },
                  { value: 'P4', label: 'P4 - Low (7d)' },
                ]}
                value={assignPriority}
                onChange={(e) => setAssignPriority(e.target.value)}
              />

              <Input
                label="Dispatch Instructions"
                placeholder="Specific instructions for crew..."
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
              />

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full"
                loading={isAssigning}
              >
                Save Assignment
              </Button>
            </form>
          </Card>

          {/* Action 3: Upload Closure Proof / After Photo */}
          <Card className="p-5 space-y-4 border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Attach Field Evidence Photo</span>
            </div>

            <form onSubmit={handleEvidenceSubmit} className="space-y-3">
              <Select
                label="Evidence Stage"
                options={[
                  { value: 'after', label: 'After / Completed Repair Proof' },
                  { value: 'progress', label: 'Work In Progress Photo' },
                  { value: 'before', label: 'Additional Before Photo' },
                ]}
                value={evidenceKind}
                onChange={(e) => setEvidenceKind(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Evidence Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <Input
                label="Caption"
                placeholder="e.g. Cold mix asphalt applied and steam-rolled"
                value={evidenceCaption}
                onChange={(e) => setEvidenceCaption(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                loading={isUploadingEvidence}
              >
                Upload Proof Photo
              </Button>
            </form>
          </Card>

          {/* Action 4: Post Progress Update Note */}
          <Card className="p-5 space-y-4 border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Post Progress / Audit Note</span>
            </div>

            <form onSubmit={handleWorkNoteSubmit} className="space-y-3">
              <Textarea
                placeholder="Log activity, vendor dispatch notes, material procurement status..."
                rows={3}
                value={workNoteText}
                onChange={(e) => setWorkNoteText(e.target.value)}
              />

              <Select
                label="Note Visibility"
                options={[
                  { value: 'public', label: 'Public (Visible on community feed)' },
                  { value: 'internal', label: 'Internal Staff Only' },
                ]}
                value={workNoteVisibility}
                onChange={(e) => setWorkNoteVisibility(e.target.value)}
              />

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5"
                loading={isPostingUpdate}
              >
                <Send className="w-3.5 h-3.5" />
                Post Note
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
