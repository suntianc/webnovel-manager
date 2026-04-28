from app.core.database import get_db


def ensure_agent_tables() -> None:
    """Create agent workflow tables used by the orchestration service."""
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS agent_definitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                description TEXT,
                system_prompt TEXT NOT NULL,
                model TEXT DEFAULT 'gpt-4o-mini',
                temperature REAL DEFAULT 0.3,
                tools TEXT DEFAULT '[]',
                output_schema TEXT,
                enabled INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workflow_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workflow_type TEXT NOT NULL,
                biz_type TEXT NOT NULL,
                biz_id INTEGER,
                title TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress INTEGER DEFAULT 0,
                current_node TEXT,
                input_payload TEXT DEFAULT '{}',
                error_message TEXT,
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workflow_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                node_name TEXT NOT NULL,
                agent_name TEXT,
                task_type TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress INTEGER DEFAULT 0,
                input_ref TEXT,
                output_ref TEXT,
                retry_count INTEGER DEFAULT 0,
                error_message TEXT,
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS agent_artifacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                task_id INTEGER,
                artifact_type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                structured_data TEXT DEFAULT '{}',
                version INTEGER DEFAULT 1,
                status TEXT DEFAULT 'draft',
                source_refs TEXT DEFAULT '[]',
                created_by_agent TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES workflow_tasks(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS workflow_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                task_id INTEGER,
                event_type TEXT NOT NULL,
                level TEXT DEFAULT 'info',
                message TEXT NOT NULL,
                payload TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES workflow_tasks(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
            CREATE INDEX IF NOT EXISTS idx_workflow_tasks_run ON workflow_tasks(run_id);
            CREATE INDEX IF NOT EXISTS idx_agent_artifacts_run ON agent_artifacts(run_id);
            CREATE INDEX IF NOT EXISTS idx_workflow_events_run_id ON workflow_events(run_id, id);

            CREATE TABLE IF NOT EXISTS novel_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT,
                original_filename TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                file_hash TEXT NOT NULL UNIQUE,
                cover_path TEXT,
                status TEXT DEFAULT 'uploaded',
                chapter_count INTEGER DEFAULT 0,
                part_count INTEGER DEFAULT 0,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS novel_chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                novel_id INTEGER NOT NULL,
                chapter_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                word_count INTEGER DEFAULT 0,
                start_offset INTEGER DEFAULT 0,
                end_offset INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (novel_id) REFERENCES novel_sources(id) ON DELETE CASCADE,
                UNIQUE (novel_id, chapter_index)
            );

            CREATE TABLE IF NOT EXISTS novel_parts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                novel_id INTEGER NOT NULL,
                part_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                chapter_start INTEGER NOT NULL,
                chapter_end INTEGER NOT NULL,
                content TEXT NOT NULL,
                word_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'ready',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (novel_id) REFERENCES novel_sources(id) ON DELETE CASCADE,
                UNIQUE (novel_id, part_index)
            );

            CREATE INDEX IF NOT EXISTS idx_novel_chapters_novel ON novel_chapters(novel_id, chapter_index);
            CREATE INDEX IF NOT EXISTS idx_novel_parts_novel ON novel_parts(novel_id, part_index);
            """
        )
        _seed_agents(conn)
        conn.commit()


def _seed_agents(conn) -> None:
    agents = [
        (
            "DirectorAgent",
            "director",
            "规划工作流、拆分任务并合并各 Agent 结果。",
            "你是网文项目的总控 Agent，负责规划、协调、合并和提出下一步动作。",
        ),
        (
            "ReaderAgent",
            "reader",
            "读取原文，抽取事实、事件、人物、设定和证据。",
            "你是原文阅读 Agent，只提取文本证据和稳定事实，不做过度发挥。",
        ),
        (
            "SummarizerAgent",
            "summarizer",
            "压缩章节、篇章和全书信息，形成分层摘要。",
            "你是摘要 Agent，负责把长文本压缩为结构化、可追溯的摘要。",
        ),
        (
            "WorldbuildingAgent",
            "worldbuilding",
            "分析或创作世界观、力量体系、势力和规则。",
            "你是世界观 Agent，关注规则、体系、势力、资源和历史背景。",
        ),
        (
            "CharacterAgent",
            "character",
            "分析或创作人物档案、弧光和关系。",
            "你是人物 Agent，关注目标、性格、成长、关系和关键选择。",
        ),
        (
            "PlotAgent",
            "plot",
            "分析或创作剧情结构、冲突、伏笔和爽点。",
            "你是剧情 Agent，关注阶段目标、冲突升级、伏笔回收和情绪回报。",
        ),
        (
            "WriterAgent",
            "writer",
            "根据设定和大纲创作正文。",
            "你是正文写作 Agent，负责写出符合设定、节奏和文风要求的章节草稿。",
        ),
        (
            "ReviewerAgent",
            "reviewer",
            "审稿并给出质量、节奏、表达和可读性意见。",
            "你是审稿 Agent，负责指出问题并给出可执行修改建议。",
        ),
        (
            "ConsistencyAgent",
            "consistency",
            "检查设定、时间线、人物行为和前后文一致性。",
            "你是一致性检查 Agent，负责发现冲突、遗漏和前后矛盾。",
        ),
        (
            "MaterialAgent",
            "material",
            "从作品档案和证据中提炼可入库素材。",
            "你是素材提炼 Agent，负责生成分类、标签、摘要和证据链清晰的素材候选。",
        ),
    ]
    for name, role, description, prompt in agents:
        conn.execute(
            """
            INSERT OR IGNORE INTO agent_definitions
                (name, role, description, system_prompt)
            VALUES (?, ?, ?, ?)
            """,
            (name, role, description, prompt),
        )
