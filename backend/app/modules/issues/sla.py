"""SLA state and countdown computation."""

from datetime import UTC, datetime

from app.core.constants import IssueStatus, SlaState


def compute_sla_state(
    status: str,
    first_assigned_at: datetime | None,
    sla_due_at: datetime | None,
) -> tuple[SlaState, float | None]:
    """
    Compute current SLA state and remaining hours.
    Returns (SlaState, remaining_hours).
    """
    if (
        not first_assigned_at
        or not sla_due_at
        or status in (IssueStatus.REPORTED, IssueStatus.RESOLVED, IssueStatus.REJECTED)
    ):
        return SlaState.NONE, None

    now = datetime.now(UTC)
    # Ensure datetimes are timezone aware UTC
    if first_assigned_at.tzinfo is None:
        first_assigned_at = first_assigned_at.replace(tzinfo=UTC)
    if sla_due_at.tzinfo is None:
        sla_due_at = sla_due_at.replace(tzinfo=UTC)

    total_window_seconds = (sla_due_at - first_assigned_at).total_seconds()
    if total_window_seconds <= 0:
        return SlaState.BREACHED, 0.0

    elapsed_seconds = (now - first_assigned_at).total_seconds()
    remaining_seconds = (sla_due_at - now).total_seconds()
    remaining_hours = round(max(0.0, remaining_seconds / 3600.0), 1)

    if now > sla_due_at:
        return SlaState.BREACHED, 0.0

    ratio = elapsed_seconds / total_window_seconds
    if ratio >= 0.75:
        return SlaState.AT_RISK, remaining_hours
    return SlaState.ON_TRACK, remaining_hours
