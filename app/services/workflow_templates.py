from dataclasses import dataclass


@dataclass(frozen=True)
class WorkflowNode:
    node_name: str
    agent_name: str | None
    task_type: str
    artifact_type: str | None = None


NOVEL_ANALYSIS_TEMPLATE = [
    WorkflowNode("ParseNovelNode", None, "parse_novel", "novel_parse_report"),
    WorkflowNode("BatchReadNode", "ReaderAgent", "chapter_batch_notes", "chapter_batch_note"),
    WorkflowNode("ArcSummaryNode", "SummarizerAgent", "arc_summary", "arc_note"),
    WorkflowNode("NovelProfileNode", "SummarizerAgent", "novel_profile", "novel_profile"),
    WorkflowNode("CharacterAnalysisNode", "CharacterAgent", "character_analysis", "character_profile"),
    WorkflowNode("WorldbuildingAnalysisNode", "WorldbuildingAgent", "worldbuilding_analysis", "worldbuilding_profile"),
    WorkflowNode("PlotAnalysisNode", "PlotAgent", "plot_analysis", "plot_profile"),
    WorkflowNode("MaterialExtractionNode", "MaterialAgent", "material_extraction", "material_candidate"),
]


NOVEL_CREATION_TEMPLATE = [
    WorkflowNode("DirectorPlanNode", "DirectorAgent", "director_plan", "creation_plan"),
    WorkflowNode("WorldbuildingCreateNode", "WorldbuildingAgent", "worldbuilding_create", "worldbuilding_profile"),
    WorkflowNode("CharacterCreateNode", "CharacterAgent", "character_create", "character_profile"),
    WorkflowNode("PlotCreateNode", "PlotAgent", "plot_create", "outline"),
    WorkflowNode("ChapterWritingNode", "WriterAgent", "chapter_writing", "chapter_draft"),
    WorkflowNode("ReviewNode", "ReviewerAgent", "review", "review_report"),
    WorkflowNode("ConsistencyCheckNode", "ConsistencyAgent", "consistency_check", "consistency_report"),
    WorkflowNode("RevisionNode", "WriterAgent", "revision", "chapter_draft"),
]


WORKFLOW_TEMPLATES = {
    "novel_analysis": NOVEL_ANALYSIS_TEMPLATE,
    "novel_creation": NOVEL_CREATION_TEMPLATE,
}


def get_workflow_template(workflow_type: str) -> list[WorkflowNode]:
    return WORKFLOW_TEMPLATES.get(workflow_type, NOVEL_ANALYSIS_TEMPLATE)
