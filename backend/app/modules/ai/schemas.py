"""Pydantic structured output models for Groq AI assist."""

from typing import Literal

from pydantic import Field

from app.core.schemas import ApiModel


class ClassificationResult(ApiModel):
    category_code: str = Field(description="One of the active category codes")
    title: str = Field(max_length=80, description="Concise English title")
    summary: str = Field(max_length=200, description="Short English summary of the issue")
    priority_hint: Literal["low", "medium", "high", "critical"] = "medium"
    keywords: list[str] = Field(default_factory=list)
    language: str = Field(default="en", description="Detected language code, e.g. en or hi")
    confidence: Literal["low", "medium", "high"] = "medium"


class DuplicateCandidateVerdict(ApiModel):
    issue_id: int
    same_problem: bool
    confidence: Literal["low", "medium", "high"]
    reason: str = Field(max_length=200)


class ClusterSummaryResult(ApiModel):
    summary: str = Field(max_length=240, description="Overview of problem across all reports")
    recurring_details: list[str] = Field(default_factory=list)
