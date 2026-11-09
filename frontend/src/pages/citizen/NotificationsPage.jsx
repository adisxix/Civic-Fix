import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../features/api/civicApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function getNotificationIcon(type) {
  switch (type) {
    case 'status_change':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'resolved_pending_verification':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'reopened':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'worker_note':
      return <MessageSquare className="w-5 h-5 text-indigo-500" />;
    default:
      return <Bell className="w-5 h-5 text-slate-500" />;
  }
}

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.notifications || notificationsData || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markRead(notification.id).unwrap();
      } catch {
        // Silently ignore
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Status changes, crew dispatches, and verification requests for your civic reports.
          </p>
        </div>

        {unreadCount > 0 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              loading={isMarkingAll}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark All as Read
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed border-2 border-slate-200">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">No notifications yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You will receive instant alerts here when municipal officers assign crew, start work, or
            complete your reported issues.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all ${
                !n.is_read
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">{n.title}</h4>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{n.body || n.message}</p>

                  {n.issue_id && (
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        to={`/issues/${n.issue_id}`}
                        onClick={() => handleNotificationClick(n)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        View Issue #{n.issue_id} <ExternalLink className="w-3 h-3" />
                      </Link>

                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
