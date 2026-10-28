"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStored } from "../lib/storage";
import {
  KEYS,
  STAGES,
  isWorkflows,
  isDate,
  emptyWorkflow,
  localDate,
  type Workflow,
  type Stage,
  type DiligenceTask,
} from "../lib/workflow";
export function useWorkflow(companyId: string) {
  const store = useStored<Workflow[]>(KEYS.workflows, [], isWorkflows);
  const value =
    store.value.find((w) => w.companyId === companyId) ??
    emptyWorkflow(companyId);
  const update = (
    change: Partial<Workflow> | ((w: Workflow) => Partial<Workflow>),
  ) =>
    store.setValue((rows) => {
      const current =
        rows.find((w) => w.companyId === companyId) ?? emptyWorkflow(companyId);
      const next = {
        ...current,
        ...(typeof change === "function" ? change(current) : change),
        companyId,
      };
      return [...rows.filter((w) => w.companyId !== companyId), next];
    });
  return { value, update, error: store.error, ready: store.ready };
}
export function CompanyWorkflowSummary({
  companyId,
  name,
  href,
}: {
  companyId: string;
  name: string;
  href?: string;
}) {
  const w = useWorkflow(companyId),
    a = w.value.nextAction;
  return (
    <div className="row-workflow">
      <label>
        <span className="sr-only">Research stage for {name}</span>
        <select
          aria-label={`Research stage for ${name}`}
          value={w.value.stage}
          disabled={!w.ready}
          onChange={(e) => w.update({ stage: e.target.value as Stage })}
        >
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {a && (
        <Link
          className={
            a.dueDate && a.dueDate < localDate()
              ? "due-overdue"
              : "next-action-link"
          }
          href={href ?? `/company/${companyId}?view=notes`}
        >
          {a.text}
          {a.dueDate && <span>Due {a.dueDate}</span>}
        </Link>
      )}
      {w.error && (
        <span role="status" className="error-text">
          {w.error}
        </span>
      )}
    </div>
  );
}
const STARTERS = [
  "Verify filing sources and accounting policies",
  "Review recurring earnings adjustments",
  "Validate maintenance capex and working capital",
  "Confirm promoter ownership and control feasibility",
  "Review financing terms and debt capacity",
];
export function CompanyWorkflow({ companyId }: { companyId: string }) {
  const w = useWorkflow(companyId),
    [task, setTask] = useState(""),
    [action, setAction] = useState(w.value.nextAction?.text ?? ""),
    [due, setDue] = useState(w.value.nextAction?.dueDate ?? ""),
    [message, setMessage] = useState("");
  useEffect(() => {
    setAction(w.value.nextAction?.text ?? "");
    setDue(w.value.nextAction?.dueDate ?? "");
  }, [w.value.nextAction?.text, w.value.nextAction?.dueDate]);
  return (
    <section
      className="work-section workflow-section"
      aria-label="Diligence and next action"
    >
      <div className="work-section-heading">
        <h2>Move the research forward.</h2>
        <span>
          {w.value.tasks.filter((t) => t.done).length} / {w.value.tasks.length}{" "}
          complete
        </span>
      </div>
      <label className="workflow-label">
        Research stage
        <select
          aria-label="Research stage"
          disabled={!w.ready}
          value={w.value.stage}
          onChange={(e) => w.update({ stage: e.target.value as Stage })}
        >
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <h3>Diligence checklist</h3>
      <div className="workflow-list">
        {w.value.tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onChange={(change) =>
              w.update((v) => ({
                tasks: v.tasks.map((x) =>
                  x.id === t.id ? { ...x, ...change } : x,
                ),
              }))
            }
            onDelete={() =>
              w.update((v) => ({ tasks: v.tasks.filter((x) => x.id !== t.id) }))
            }
          />
        ))}
      </div>
      {!w.value.tasks.length && (
        <p className="fine-print">
          Start with your own question or add the five starter checks.
        </p>
      )}
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!task.trim()) return;
          w.update((v) => ({
            tasks: [
              ...v.tasks,
              { id: crypto.randomUUID(), text: task.trim(), done: false },
            ],
          }));
          setTask("");
        }}
      >
        <label>
          New diligence task
          <input
            required
            maxLength={500}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
        </label>
        <button className="button tonal" disabled={!w.ready}>
          Add task
        </button>
      </form>
      <button
        className="text-button"
        disabled={!w.ready}
        onClick={() => {
          w.update((v) => ({
            tasks: [
              ...v.tasks,
              ...STARTERS.filter(
                (text) => !v.tasks.some((t) => t.text === text),
              ).map((text) => ({ id: crypto.randomUUID(), text, done: false })),
            ],
          }));
          setMessage("Starter checks added. Existing tasks were preserved.");
        }}
      >
        Add starter checklist
      </button>
      <form
        className="workflow-form next-action-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isDate(due)) {
            setMessage("Enter a valid due date.");
            return;
          }
          if (action.trim()) {
            w.update({ nextAction: { text: action.trim(), dueDate: due } });
            setMessage("Next action saved.");
          }
        }}
      >
        <label>
          Next action
          <input
            required
            maxLength={500}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </label>
        <label>
          Due date (optional)
          <input
            type="date"
            aria-label="Next action due date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <button className="button primary" disabled={!w.ready}>
          Save next action
        </button>
      </form>
      {w.value.nextAction && (
        <p className="next-action-summary">
          {w.value.nextAction.text}{" "}
          {w.value.nextAction.dueDate && (
            <span
              className={
                w.value.nextAction.dueDate < localDate() ? "due-overdue" : ""
              }
            >
              Due {w.value.nextAction.dueDate}
            </span>
          )}{" "}
          <button
            className="text-button"
            onClick={() => {
              w.update({ nextAction: null });
              setMessage("Next action completed and cleared.");
            }}
          >
            Complete next action
          </button>
        </p>
      )}
      <p role="status" className="action-feedback">
        {w.error || message}
      </p>
    </section>
  );
}
function TaskRow({
  task,
  onChange,
  onDelete,
}: {
  task: DiligenceTask;
  onChange: (p: Partial<DiligenceTask>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [text, setText] = useState(task.text);
  return (
    <div className="workflow-row">
      <label className="task-label">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onChange({ done: e.target.checked })}
        />
        <span>{task.text}</span>
      </label>
      {editing ? (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) {
              onChange({ text: text.trim() });
              setEditing(false);
            }
          }}
        >
          <input
            aria-label="Edit diligence task"
            required
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="text-button">Save task</button>
          <button
            type="button"
            className="text-button"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="workflow-actions">
          <button
            className="text-button"
            aria-label={`Edit task ${task.text}`}
            onClick={() => {
              setText(task.text);
              setEditing(true);
            }}
          >
            Edit
          </button>
          <button
            className="text-button"
            aria-label={`Delete task ${task.text}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
