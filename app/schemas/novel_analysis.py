from typing import Literal

from pydantic import BaseModel, Field


EvidenceKind = Literal["novel_part", "novel_chapter", "artifact"]


class EvidenceRef(BaseModel):
    type: EvidenceKind = Field(..., description="Evidence source type.")
    id: int | None = Field(None, description="Source id when available.")
    chapter_start: int | None = None
    chapter_end: int | None = None
    quote: str = Field(..., min_length=1, max_length=160)


class KeyFact(BaseModel):
    kind: str = Field(..., min_length=1, max_length=40)
    title: str = Field(..., min_length=1, max_length=120)
    summary: str = Field(..., min_length=1, max_length=500)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class TimelineEvent(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    summary: str = Field(..., min_length=1, max_length=500)
    chapter_start: int | None = None
    chapter_end: int | None = None
    evidence: list[EvidenceRef] = Field(default_factory=list)


class BatchReadingResult(BaseModel):
    coverage: str = Field(..., min_length=1, max_length=300)
    key_facts: list[KeyFact] = Field(default_factory=list)
    timeline_events: list[TimelineEvent] = Field(default_factory=list)
    characters: list[KeyFact] = Field(default_factory=list)
    settings: list[KeyFact] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    notes: str | None = Field(None, max_length=800)


class ArcItem(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    summary: str = Field(..., min_length=1, max_length=800)
    key_turning_points: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class ArcSummaryResult(BaseModel):
    arcs: list[ArcItem] = Field(default_factory=list)
    timeline_summary: str = Field(..., min_length=1, max_length=1200)
    unresolved_threads: list[str] = Field(default_factory=list)
    notes: str | None = Field(None, max_length=800)


class NovelProfileResult(BaseModel):
    premise: str = Field(..., min_length=1, max_length=800)
    genre_tags: list[str] = Field(default_factory=list)
    style_notes: list[str] = Field(default_factory=list)
    core_conflicts: list[str] = Field(default_factory=list)
    main_themes: list[str] = Field(default_factory=list)
    reading_summary: str = Field(..., min_length=1, max_length=1200)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class CharacterProfile(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    role: str = Field(..., min_length=1, max_length=80)
    traits: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    relationships: list[str] = Field(default_factory=list)
    current_state: str = Field(..., min_length=1, max_length=500)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class CharacterAnalysisResult(BaseModel):
    characters: list[CharacterProfile] = Field(default_factory=list)
    relationship_notes: list[str] = Field(default_factory=list)
    risk_notes: list[str] = Field(default_factory=list)


class WorldbuildingItem(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    item_type: str = Field(..., min_length=1, max_length=40)
    summary: str = Field(..., min_length=1, max_length=700)
    rules_or_limits: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class WorldbuildingAnalysisResult(BaseModel):
    items: list[WorldbuildingItem] = Field(default_factory=list)
    consistency_notes: list[str] = Field(default_factory=list)
    missing_context: list[str] = Field(default_factory=list)


class PlotAnalysisResult(BaseModel):
    main_plotline: str = Field(..., min_length=1, max_length=1000)
    conflicts: list[str] = Field(default_factory=list)
    foreshadowing: list[KeyFact] = Field(default_factory=list)
    payoffs: list[KeyFact] = Field(default_factory=list)
    pacing_notes: list[str] = Field(default_factory=list)
    reusable_beats: list[KeyFact] = Field(default_factory=list)
