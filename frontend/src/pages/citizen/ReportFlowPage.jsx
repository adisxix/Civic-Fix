import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MapPin,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Heart,
  Send,
} from 'lucide-react';
import {
  useGetMetaQuery,
  usePrecheckReportMutation,
  useSubmitReportMutation,
  useSupportIssueMutation,
} from '../../features/api/civicApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setDraftField, resetDraft } from '../../features/report/reportDraftSlice';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import LocationPicker from '../../components/shared/LocationPicker';
import ImageUploader from '../../components/shared/ImageUploader';
import StatusBadge from '../../components/shared/StatusBadge';
import AiSuggestionChip from '../../components/shared/AiSuggestionChip';

export default function ReportFlowPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.reportDraft);

  const { data: meta } = useGetMetaQuery();
  const [precheck, { isLoading: isPrechecking }] = usePrecheckReportMutation();
  const [submitReport, { isLoading: isSubmitting }] = useSubmitReportMutation();
  const [supportIssue, { isLoading: isSupporting }] = useSupportIssueMutation();

  const [step, setStep] = useState(draft.step || 1);
  const [imageFile, setImageFile] = useState(null);
  const [precheckResult, setPrecheckResult] = useState(null);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  const categories = meta?.categories || [];
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  // Step 1 -> Step 2
  const handleLocationNext = () => {
    if (!draft.location?.latitude || !draft.location?.longitude) {
      toast.error('Please pick a location on the map');
      return;
    }
    setStep(2);
    dispatch(setDraftField({ field: 'step', value: 2 }));
  };

  // Step 2 -> Step 3 (Trigger Precheck / AI Duplicate Check)
  const handleDetailsNext = async () => {
    if (!draft.description || draft.description.trim().length < 10) {
      toast.error('Please provide a description of at least 10 characters');
      return;
    }

    try {
      setStep(3);
      dispatch(setDraftField({ field: 'step', value: 3 }));

      const res = await precheck({
        description: draft.description,
        latitude: draft.location.latitude,
        longitude: draft.location.longitude,
        category_id: draft.categoryId ? Number(draft.categoryId) : undefined,
      }).unwrap();

      const data = res.data;
      setPrecheckResult(data);

      // If AI suggested a category and none was selected, auto-select
      if (data?.suggestion?.categoryId && !draft.categoryId) {
        dispatch(setDraftField({ field: 'categoryId', value: data.suggestion.categoryId }));
        dispatch(setDraftField({ field: 'aiSuggestion', value: data.suggestion }));
      }
    } catch (err) {
      toast.error(err?.data?.detail || 'Precheck failed. You can continue manually.');
    }
  };

  // Support duplicate directly
  const handleSupportDuplicate = async (issueId) => {
    try {
      await supportIssue(issueId).unwrap();
      toast.success('You supported this issue! Municipal crews have been notified.');
      dispatch(resetDraft());
      navigate(`/issues/${issueId}`);
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to support issue');
    }
  };

  // Choose to join existing issue with new evidence
  const handleJoinDuplicate = (candidateId) => {
    dispatch(setDraftField({ field: 'joinIssueId', value: candidateId }));
    setStep(4);
    dispatch(setDraftField({ field: 'step', value: 4 }));
  };

  // Choose standalone report
  const handleProceedStandalone = () => {
    dispatch(setDraftField({ field: 'joinIssueId', value: null }));
    setStep(4);
    dispatch(setDraftField({ field: 'step', value: 4 }));
  };

  // Step 4 -> Final Submit
  const handleFinalSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('description', draft.description);
      formData.append('latitude', draft.location.latitude);
      formData.append('longitude', draft.location.longitude);
      formData.append('category_id', draft.categoryId || (categories[0] ? categories[0].id : 1));

      if (draft.location.address) {
        formData.append('address', draft.location.address);
      }
      if (draft.aiSuggestion?.categoryId) {
        formData.append('ai_suggested_category_id', draft.aiSuggestion.categoryId);
      }
      if (draft.joinIssueId) {
        formData.append('join_issue_id', draft.joinIssueId);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await submitReport(formData).unwrap();
      const issue = res.data;
      setSubmittedIssue(issue);
      dispatch(resetDraft());
      toast.success('Civic issue reported successfully!');
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to submit report. Please try again.');
    }
  };

  // Submission Complete View
  if (submittedIssue) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Card className="p-8 sm:p-12 shadow-sm border border-emerald-100 bg-white">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Report Successfully Submitted!</h2>
          <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
            Your report has been logged with your ward administration. You will receive real-time
            notifications as crews take action.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block text-left text-xs font-mono">
            <div>
              <span className="text-slate-400">Issue ID:</span> #{submittedIssue.id}
            </div>
            <div>
              <span className="text-slate-400">Initial Status:</span>{' '}
              {submittedIssue.status || 'Reported'}
            </div>
            {submittedIssue.address && (
              <div>
                <span className="text-slate-400">Location:</span> {submittedIssue.address}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            <Link to={`/issues/${submittedIssue.id}`}>
              <Button variant="primary" className="w-full sm:w-auto">
                View Issue Details
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setSubmittedIssue(null);
                setStep(1);
              }}
            >
              Report Another Issue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      {/* Wizard Progress Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report a Civic Issue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Follow 4 simple steps to report potholes, garbage, streetlights, or water issues.
        </p>

        {/* Steps indicator */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { num: 1, title: 'Location' },
            { num: 2, title: 'Details' },
            { num: 3, title: 'Check' },
            { num: 4, title: 'Review' },
          ].map((s) => (
            <div
              key={s.num}
              className={`text-center py-2 border-b-2 font-medium text-xs transition-colors ${
                step === s.num
                  ? 'border-emerald-600 text-emerald-600'
                  : step > s.num
                    ? 'border-emerald-400 text-slate-700'
                    : 'border-slate-200 text-slate-400'
              }`}
            >
              Step {s.num}: {s.title}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: LOCATION */}
      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Pinpoint Issue Location</h2>
          </div>
          <p className="text-xs text-slate-500">
            Click on the map or drag the pin to set the exact spot. Your browser GPS can auto-fill
            this.
          </p>

          <LocationPicker
            latitude={draft.location.latitude}
            longitude={draft.location.longitude}
            address={draft.location.address}
            onChange={(loc) => {
              dispatch(
                setDraftField({
                  field: 'location',
                  value: { ...draft.location, ...loc },
                }),
              );
            }}
          />

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={handleLocationNext}
              className="flex items-center gap-2"
            >
              Next: Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: DETAILS & EVIDENCE */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Issue Details & Evidence</h2>
          </div>

          <div>
            <ImageUploader
              label="Attach Photo of the Issue (Optional)"
              imagePreview={draft.imagePreview}
              onImageSelect={(file, preview) => {
                setImageFile(file);
                dispatch(setDraftField({ field: 'imagePreview', value: preview }));
              }}
              onImageClear={() => {
                setImageFile(null);
                dispatch(setDraftField({ field: 'imagePreview', value: null }));
              }}
            />
          </div>

          <div>
            <Select
              label="Issue Category"
              placeholder="Select category or let AI auto-detect"
              options={categoryOptions}
              value={draft.categoryId || ''}
              onChange={(e) =>
                dispatch(
                  setDraftField({
                    field: 'categoryId',
                    value: e.target.value ? Number(e.target.value) : null,
                  }),
                )
              }
            />
          </div>

          <div>
            <Textarea
              label="Description"
              placeholder="Describe what is wrong, exact landmarks, severity, or how long it has been broken..."
              rows={4}
              value={draft.description}
              onChange={(e) =>
                dispatch(setDraftField({ field: 'description', value: e.target.value }))
              }
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 10 characters. Mention nearby landmarks for faster crew dispatch.
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleDetailsNext}
              className="flex items-center gap-2"
            >
              Next: AI & Duplicate Check
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: AI ANALYSIS & DUPLICATE CHECK */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">AI Analysis & Duplicate Check</h2>
          </div>

          {isPrechecking ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                Checking nearby reports and analyzing with Gemini AI...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* AI Classification & Summary Pill */}
              {precheckResult?.suggestion && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Gemini AI Recommendation
                    </span>
                    <AiSuggestionChip
                      confidence={precheckResult.suggestion.confidence}
                      categoryName={precheckResult.suggestion.categoryName}
                    />
                  </div>
                  <p className="text-xs text-indigo-800">
                    {precheckResult.suggestion.reasoning || precheckResult.suggestion.summary}
                  </p>
                </div>
              )}

              {/* Duplicate Candidates Found */}
              {precheckResult?.candidates && precheckResult.candidates.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">Similar issues already reported nearby!</p>
                      <p className="mt-0.5">
                        Supporting an existing issue avoids duplicate tickets and moves it higher in
                        the crew&apos;s priority queue.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {precheckResult.candidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={cand.status} />
                              <span className="text-xs font-semibold text-slate-500">
                                {Math.round(cand.distance_meters)}m away
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 mt-1">
                              {cand.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {cand.address || cand.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                            onClick={() => handleSupportDuplicate(cand.id)}
                            loading={isSupporting}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            Support This Issue Instead
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleJoinDuplicate(cand.id)}
                          >
                            Add My Evidence To This
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full text-slate-700"
                      onClick={handleProceedStandalone}
                    >
                      No, Mine Is a Different Issue → Proceed
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="font-semibold text-slate-800 text-sm">
                    No duplicate reports found nearby!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your report appears to be new and unique. Click proceed to review and file it.
                  </p>
                  <div className="pt-2">
                    <Button variant="primary" onClick={handleProceedStandalone}>
                      Proceed to Review
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-start pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {step === 4 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Review & Submit Report</h2>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                Location
              </span>
              <p className="mt-0.5 font-medium">
                {draft.location.address || 'Selected GPS Coordinates'}
              </p>
              <p className="text-slate-400 font-mono text-[10px]">
                {draft.location.latitude.toFixed(5)}, {draft.location.longitude.toFixed(5)}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                Category
              </span>
              <p className="mt-0.5 font-medium">
                {categories.find((c) => c.id === draft.categoryId)?.name || 'General Civic'}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                Description
              </span>
              <p className="mt-0.5 whitespace-pre-wrap">{draft.description}</p>
            </div>

            {draft.joinIssueId && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900">
                Joining existing issue #{draft.joinIssueId} with supplemental evidence.
              </div>
            )}

            {draft.imagePreview && (
              <div>
                <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px] mb-1">
                  Attached Photo
                </span>
                <img
                  src={draft.imagePreview}
                  alt="Report evidence preview"
                  className="w-32 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleFinalSubmit}
              loading={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Confirm & Submit Report
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
