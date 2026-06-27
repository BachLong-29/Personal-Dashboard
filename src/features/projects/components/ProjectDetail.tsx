'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { CoinIcon } from '@/components/common/CoinIcon';
import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import { AddTaskModal } from '@/features/tasks/components/shared/AddTaskModal';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { taskToUITask } from '@/features/tasks/data/adapters';
import type { Character } from '@/features/dashboard/types';
import { Link } from '@/i18n/navigation';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/libs/utils';
import type { Task, TaskStatus, UpdateTaskPayload } from '@/types';

import { COLOR_CSS } from '../constants';
import { useProject } from '../hooks/useProject';
import { useArchiveProject, useCompleteProject } from '../hooks/useProjectActions';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectTaskBoard } from './ProjectTaskBoard';
import { ProjectTaskList } from './ProjectTaskList';

export function ProjectDetail({ id }: { id: string }) {
  // ── Character for topbar ────────────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(id);
  const updateTask = useUpdateTask();
  const archiveProject = useArchiveProject();
  const completeProject = useCompleteProject();

  const viewMode = useUIStore((s) => s.projectViewMode);
  const setViewMode = useUIStore((s) => s.setProjectViewMode);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const refetchProject = () => queryClient.invalidateQueries({ queryKey: ['project', id] });

  function handleChangeStatus(taskId: string, status: TaskStatus) {
    updateTask.mutate({ id: taskId, status }, { onSuccess: refetchProject });
  }
  function handleSaveEdit(taskId: string, payload: UpdateTaskPayload, onSuccess: () => void) {
    updateTask.mutate(
      { id: taskId, ...payload },
      {
        onSuccess: () => {
          setEditingTask(null);
          refetchProject();
          onSuccess();
        },
      },
    );
  }
  function handleToggleDone(task: Task) {
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({ id: task.id, status: next }, { onSuccess: refetchProject });
  }

  function handleArchive() {
    if (!confirm('Archive this project? Its tasks will be hidden too.')) return;
    archiveProject.mutate(id);
  }
  function handleComplete() {
    completeProject.mutate(id, {
      onError: (err) => alert(err instanceof Error ? err.message : 'Cannot complete project yet.'),
    });
  }

  if (isLoading || !project) {
    return (
      <div className="flex flex-col h-screen bg-[var(--bg)]">
        <DashboardTopbar char={char} dateStr={dateStr} onEndDay={() => {}} />
        <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--text-lo)]">
          {isLoading ? 'Loading project…' : 'Project not found.'}
        </div>
      </div>
    );
  }

  const accent = COLOR_CSS[project.color];
  const pct = Math.round(project.progress * 100);
  const completed = project.status === 'completed';
  const canComplete = !completed && project.totalTasks > 0 && project.progress >= 1;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardTopbar char={char} dateStr={dateStr} onEndDay={() => {}} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 gap-4">
        {/* Back */}
        <Link
          href="/projects"
          className="text-[11px] text-[var(--text-mid)] hover:text-[var(--gold)] no-underline w-fit"
        >
          ◂ Projects
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <span
            className="w-12 h-12 shrink-0 rounded-[var(--r-sm)] flex items-center justify-center text-[24px] border"
            style={{
              background: `color-mix(in oklch, ${accent} 12%, transparent)`,
              borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
            }}
          >
            {project.icon}
          </span>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-[var(--text-hi)] [font-family:var(--f-title)] tracking-[0.02em]">
                {project.name}
              </h1>
              {completed && <span className="text-[var(--gold)] text-[14px]">✓ Completed</span>}
            </div>
            {project.description && (
              <p className="text-[12px] text-[var(--text-mid)] mt-1 max-w-[640px]">
                {project.description}
              </p>
            )}

            {/* Progress */}
            <div className="flex items-center gap-3 mt-3 max-w-[420px]">
              <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${pct}%`, background: accent }}
                />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-mid)] [font-family:var(--f-title)]">
                {project.doneTasks}/{project.totalTasks} · {pct}%
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2 text-[11px] [font-family:var(--f-title)] tracking-[0.04em]">
              <span className="text-[var(--gold)]">✦ {project.xp} XP</span>
              <span className="text-[var(--gold)]">
                <CoinIcon /> {project.coins}
              </span>
              {project.deadline && (
                <span className="text-[var(--text-lo)]">
                  ⏱{' '}
                  {new Date(project.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowEdit(true)} className={btnGhost}>
              Edit
            </button>
            {!completed && (
              <button type="button" onClick={handleArchive} className={btnGhost}>
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={handleComplete}
              disabled={!canComplete || completeProject.isPending}
              className={cn(
                'px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] [font-family:var(--f-title)] rounded-[var(--r-sm)] border transition-all',
                canComplete
                  ? 'bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] text-[#0a0400] border-[var(--gold)] hover:-translate-y-px'
                  : 'border-[var(--border)] text-[var(--text-lo)] opacity-50 cursor-not-allowed',
              )}
              title={canComplete ? 'Claim reward' : 'Finish all tasks first'}
            >
              ✓ Complete
            </button>
          </div>
        </div>

        {/* Toolbar: view toggle + add task */}
        {!completed && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] p-1">
              {(['kanban', 'list'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] rounded-[var(--r-sm)] transition-all [font-family:var(--f-title)]',
                    viewMode === m
                      ? 'bg-[oklch(0.74_0.17_85_/_0.14)] text-[var(--gold)]'
                      : 'text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                  )}
                >
                  {m === 'kanban' ? '▦ Board' : '☰ List'}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button type="button" onClick={() => setShowAddTask(true)} className={btnGhost}>
              ＋ Add Task
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'kanban' ? (
            <ProjectTaskBoard
              tasks={project.tasks}
              onChangeStatus={handleChangeStatus}
              onEdit={setEditingTask}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <ProjectTaskList
                tasks={project.tasks}
                onToggleDone={handleToggleDone}
                onEdit={setEditingTask}
              />
            </div>
          )}
        </div>
      </div>

      <ProjectFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        project={project}
        onSaved={refetchProject}
      />
      <AddTaskModal
        open={showAddTask}
        projectId={id}
        onClose={() => setShowAddTask(false)}
        onSaved={refetchProject}
      />
      <EditTaskModal
        task={editingTask ? taskToUITask(editingTask) : null}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        saving={updateTask.isPending}
      />
    </div>
  );
}

const btnGhost =
  'px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] [font-family:var(--f-title)] rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[var(--border-hi)] transition-all';
