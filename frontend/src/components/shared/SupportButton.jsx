import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSupportIssueMutation, useWithdrawSupportMutation } from '../../features/api/civicApi';
import { useAppSelector } from '../../app/hooks';
import { toast } from 'sonner';

export function SupportButton({ issueId, hasSupported, supportersCount, isReporter = false }) {
  const { user } = useAppSelector((state) => state.auth);
  const [support, { isLoading: isSupporting }] = useSupportIssueMutation();
  const [withdraw, { isLoading: isWithdrawing }] = useWithdrawSupportMutation();

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in as a citizen to support this issue.');
      return;
    }

    if (hasSupported) {
      if (isReporter) {
        toast.info('You filed this report; you cannot withdraw your primary backing.');
        return;
      }
      try {
        await withdraw(issueId).unwrap();
        toast.success('Withdrew support');
      } catch (err) {
        toast.error(err?.data?.error?.message || 'Could not withdraw support');
      }
    } else {
      try {
        await support(issueId).unwrap();
        toast.success('Supported! You are now linked to this issue for fix verification.');
      } catch (err) {
        toast.error(err?.data?.error?.message || 'Could not add support');
      }
    }
  };

  const loading = isSupporting || isWithdrawing;

  return (
    <Button
      variant={hasSupported ? 'lime' : 'secondary'}
      size="sm"
      disabled={loading}
      onClick={handleToggle}
      className="font-semibold text-xs"
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${hasSupported ? 'fill-current' : ''}`} />
      <span>{hasSupported ? 'Supported' : 'Support Issue'}</span>
      <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[11px] font-bold">
        {supportersCount}
      </span>
    </Button>
  );
}

export default SupportButton;
