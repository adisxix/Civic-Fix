"""CivicFix application constants."""

from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "citizen"
    WARD_ADMIN = "ward_admin"


class IssueStatus(str, Enum):
    REPORTED = "reported"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_VERIFICATION = "awaiting_verification"
    RESOLVED = "resolved"
    REOPENED = "reopened"
    REJECTED = "rejected"


class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceKind(str, Enum):
    BEFORE = "before"
    PROGRESS = "progress"
    AFTER = "after"


class ReviewStatus(str, Enum):
    ACCEPTED = "accepted"
    FLAGGED = "flagged"
    REJECTED = "rejected"


class UpdateType(str, Enum):
    REPORTED = "reported"
    REPORT_ADDED = "report_added"
    SUPPORT_ADDED = "support_added"
    TRIAGE = "triage"
    ASSIGNMENT = "assignment"
    STATUS_CHANGED = "status_changed"
    NOTE = "note"
    EVIDENCE_ADDED = "evidence_added"
    VERIFICATION = "verification"
    REOPENED = "reopened"
    MODERATION = "moderation"


class UpdateVisibility(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"


class FeedbackOutcome(str, Enum):
    CONFIRMED = "confirmed"
    DISPUTED = "disputed"


class NotificationType(str, Enum):
    ISSUE_ASSIGNED = "issue_assigned"
    STATUS_CHANGED = "status_changed"
    VERIFICATION_REQUESTED = "verification_requested"
    ISSUE_REOPENED = "issue_reopened"
    SUPPORT_MILESTONE = "support_milestone"
    NEW_REPORT = "new_report"


class SlaState(str, Enum):
    NONE = "none"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BREACHED = "breached"
