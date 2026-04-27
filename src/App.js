import { useState, useEffect, useRef } from "react";
import "./App.css";

const STORAGE_KEY = "kanban-multi-board-v2";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b" },
  low:    { label: "Low",    color: "#22c55e" },
};

const DEFAULT_COLUMN_COLORS = {
  "Backlog":     "#6b7280",
  "To Do":       "#d97706",
  "In Progress": "#2563eb",
  "Done":        "#16a34a",
};

function getColumnColor(name) {
  return DEFAULT_COLUMN_COLORS[name] ?? "#6b7280";
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createTask(text) {
  return {
    id: makeId(),
    text,
    description: "",
    priority: null,
    dueDate: null,
    checklist: [],
    createdAt: Date.now(),
  };
}

function createBoard(name) {
  return {
    id: makeId(),
    name,
    columnOrder: ["Backlog", "To Do", "In Progress", "Done"],
    columns: {
      Backlog: [createTask("Example task")],
      "To Do": [],
      "In Progress": [],
      Done: [],
    },
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const first = createBoard("My First Board");
  return { boards: [first], currentBoardId: first.id };
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + "T00:00:00") < today;
}

function isDueToday(dueDate) {
  if (!dueDate) return false;
  return (
    new Date(dueDate + "T00:00:00").toDateString() === new Date().toDateString()
  );
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Task Modal ────────────────────────────────────────────────────────────────

function TaskModal({ task, column, onClose, onSave, onDelete }) {
  const [text, setText] = useState(task.text);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [checklist, setChecklist] = useState(task.checklist ?? []);
  const [newCheckItem, setNewCheckItem] = useState("");

  const save = () =>
    onSave({
      ...task,
      text: text.trim() || task.text,
      description,
      priority: priority || null,
      dueDate: dueDate || null,
      checklist,
    });

  const handleClose = () => { save(); onClose(); };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { id: makeId(), text: newCheckItem.trim(), done: false }]);
    setNewCheckItem("");
  };

  const toggleCheck = (id) =>
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const deleteCheck = (id) =>
    setChecklist(checklist.filter((c) => c.id !== id));

  const doneCount = checklist.filter((c) => c.done).length;
  const progress = checklist.length ? (doneCount / checklist.length) * 100 : 0;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-col-badge" style={{ background: getColumnColor(column) }}>
            {column}
          </span>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <input
          className="modal-title-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task name"
        />

        <div className="modal-two-col">
          <div className="modal-field">
            <label>Priority</label>
            <div className="priority-buttons">
              {["", "low", "medium", "high"].map((p) => (
                <button
                  key={p}
                  className={`priority-btn ${priority === p ? "selected" : ""}`}
                  onClick={() => setPriority(p === priority ? "" : p)}
                >
                  {p ? (
                    <>
                      <span className="priority-dot" style={{ background: PRIORITY_CONFIG[p].color }} />
                      {PRIORITY_CONFIG[p].label}
                    </>
                  ) : "None"}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label>Due Date</label>
            <div className="due-date-row">
              <input
                type="date"
                className="due-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {dueDate && (
                <button className="icon-btn danger" onClick={() => setDueDate("")} title="Clear">✕</button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-field">
          <label>Description</label>
          <textarea
            className="modal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, links, context…"
            rows={4}
          />
        </div>

        <div className="modal-field">
          <label>
            Checklist
            {checklist.length > 0 && (
              <span className="check-label-count">{doneCount}/{checklist.length}</span>
            )}
          </label>

          {checklist.length > 0 && (
            <div className="checklist-track">
              <div className="checklist-fill" style={{ width: `${progress}%` }} />
            </div>
          )}

          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.id} className="check-item">
                <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} />
                <span className={`check-text ${item.done ? "check-done" : ""}`}>{item.text}</span>
                <button className="icon-btn danger" onClick={() => deleteCheck(item.id)}>✕</button>
              </li>
            ))}
          </ul>

          <div className="check-add">
            <input
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
              placeholder="Add item…"
            />
            <button onClick={addCheckItem}>+</button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-danger" onClick={() => { onDelete(); onClose(); }}>
            Delete task
          </button>
          <button className="btn-primary" onClick={handleClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState(loadState);
  const [newTask, setNewTask] = useState("");
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [renamingBoardId, setRenamingBoardId] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [renamingCol, setRenamingCol] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dark-mode") === "true"
  );

  const fileInputRef = useRef(null);

  const currentBoard = state.boards.find((b) => b.id === state.currentBoardId);
  const board = currentBoard?.columns ?? {};
  const columnOrder = currentBoard?.columnOrder ?? [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem("dark-mode", darkMode);
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  const patchCurrentBoard = (patch) =>
    setState((s) => ({
      ...s,
      boards: s.boards.map((b) => (b.id === s.currentBoardId ? { ...b, ...patch } : b)),
    }));

  const setColumns = (cols) => patchCurrentBoard({ columns: cols });

  // ── Board CRUD ─────────────────────────────────────────────────────────────

  const addBoard = () => {
    const name = newBoardName.trim() || "New Board";
    const b = createBoard(name);
    setState((s) => ({ boards: [...s.boards, b], currentBoardId: b.id }));
    setNewBoardName("");
  };

  const deleteBoard = (id) => {
    setState((s) => {
      const boards = s.boards.filter((b) => b.id !== id);
      if (!boards.length) {
        const fresh = createBoard("My Board");
        return { boards: [fresh], currentBoardId: fresh.id };
      }
      return {
        boards,
        currentBoardId: s.currentBoardId === id ? boards[0].id : s.currentBoardId,
      };
    });
  };

  const renameBoard = (id, name) => {
    if (!name.trim()) return setRenamingBoardId(null);
    setState((s) => ({
      ...s,
      boards: s.boards.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)),
    }));
    setRenamingBoardId(null);
  };

  const duplicateBoard = (b) => {
    const copy = { ...JSON.parse(JSON.stringify(b)), id: makeId(), name: b.name + " (copy)" };
    setState((s) => ({ boards: [...s.boards, copy], currentBoardId: copy.id }));
  };

  // ── Column CRUD ────────────────────────────────────────────────────────────

  const addColumn = () => {
    const name = newColName.trim();
    if (!name || columnOrder.includes(name)) return;
    patchCurrentBoard({
      columnOrder: [...columnOrder, name],
      columns: { ...board, [name]: [] },
    });
    setNewColName("");
    setAddingColumn(false);
  };

  const deleteColumn = (col) => {
    const count = board[col]?.length ?? 0;
    if (count > 0 && !window.confirm(`"${col}" has ${count} task(s). Delete anyway?`)) return;
    const newCols = { ...board };
    delete newCols[col];
    patchCurrentBoard({ columnOrder: columnOrder.filter((c) => c !== col), columns: newCols });
  };

  const renameColumn = (oldName, newName) => {
    const trimmed = newName.trim();
    setRenamingCol(null);
    if (!trimmed || trimmed === oldName) return;
    if (columnOrder.includes(trimmed)) { alert("A column with that name already exists."); return; }
    const newCols = {};
    for (const [k, v] of Object.entries(board)) newCols[k === oldName ? trimmed : k] = v;
    patchCurrentBoard({
      columnOrder: columnOrder.map((c) => (c === oldName ? trimmed : c)),
      columns: newCols,
    });
  };

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  const addTask = () => {
    if (!newTask.trim() || !columnOrder.length) return;
    const firstCol = columnOrder[0];
    setColumns({ ...board, [firstCol]: [...(board[firstCol] ?? []), createTask(newTask.trim())] });
    setNewTask("");
  };

  const updateTask = (column, updated) => {
    setColumns({ ...board, [column]: board[column].map((t) => (t.id === updated.id ? updated : t)) });
    setSelectedTask((s) => (s?.task.id === updated.id ? { column, task: updated } : s));
  };

  const deleteTask = (column, id) => {
    setColumns({ ...board, [column]: board[column].filter((t) => t.id !== id) });
    setSelectedTask((s) => (s?.task.id === id ? null : s));
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const onDragStart = (column, task, index) => setDragging({ column, task, index });

  const onDragOverCard = (e, column, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOver?.column !== column || dragOver?.index !== index)
      setDragOver({ column, index });
  };

  const onDrop = (targetCol, dropIndex) => {
    if (!dragging) return;
    const { column: srcCol, task, index: srcIndex } = dragging;
    const newBoard = { ...board };
    if (srcCol === targetCol) {
      const col = [...(board[srcCol] ?? [])];
      col.splice(srcIndex, 1);
      col.splice(dropIndex > srcIndex ? Math.max(0, dropIndex - 1) : dropIndex, 0, task);
      newBoard[srcCol] = col;
    } else {
      newBoard[srcCol] = (board[srcCol] ?? []).filter((t) => t.id !== task.id);
      const target = [...(board[targetCol] ?? [])];
      target.splice(dropIndex, 0, task);
      newBoard[targetCol] = target;
    }
    setColumns(newBoard);
    setDragging(null);
    setDragOver(null);
  };

  // ── Export / Import ────────────────────────────────────────────────────────

  const exportBoard = () => {
    if (!currentBoard) return;
    const blob = new Blob([JSON.stringify(currentBoard, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentBoard.name.replace(/\s+/g, "-")}-board.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBoard = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.name || !data.columns || !data.columnOrder) throw new Error();
        const imported = { ...data, id: makeId(), name: data.name + " (imported)" };
        setState((s) => ({ boards: [...s.boards, imported], currentBoardId: imported.id }));
      } catch {
        alert("Could not read board file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Search ─────────────────────────────────────────────────────────────────

  const matchesSearch = (task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return task.text.toLowerCase().includes(q) || (task.description ?? "").toLowerCase().includes(q);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <span className="sidebar-title">Boards</span>}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)}>
            {sidebarOpen ? "◂" : "▸"}
          </button>
        </div>

        {sidebarOpen && (
          <>
            <ul className="board-list">
              {state.boards.map((b) => (
                <li key={b.id} className={`board-item ${b.id === state.currentBoardId ? "active" : ""}`}>
                  {renamingBoardId === b.id ? (
                    <input
                      className="rename-input"
                      autoFocus
                      defaultValue={b.name}
                      onBlur={(e) => renameBoard(b.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameBoard(b.id, e.target.value);
                        if (e.key === "Escape") setRenamingBoardId(null);
                      }}
                    />
                  ) : (
                    <span
                      className="board-name"
                      onClick={() => setState((s) => ({ ...s, currentBoardId: b.id }))}
                      onDoubleClick={() => setRenamingBoardId(b.id)}
                      title="Double-click to rename"
                    >{b.name}</span>
                  )}
                  <div className="board-actions">
                    <button className="icon-btn" title="Rename" onClick={() => setRenamingBoardId(b.id)}>✎</button>
                    <button className="icon-btn" title="Duplicate" onClick={() => duplicateBoard(b)}>⎘</button>
                    <button className="icon-btn danger" title="Delete" onClick={() => deleteBoard(b.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="new-board">
              <input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name…"
                onKeyDown={(e) => e.key === "Enter" && addBoard()}
              />
              <button onClick={addBoard}>+</button>
            </div>

            <div className="sidebar-io">
              <button className="io-btn" onClick={exportBoard}>⬇ Export board</button>
              <button className="io-btn" onClick={() => fileInputRef.current?.click()}>⬆ Import board</button>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={importBoard} />
            </div>
          </>
        )}
      </aside>

      {/* Main content */}
      <div className="app">
        <header className="app-header">
          <h1>{currentBoard?.name ?? "Kanban Board"}</h1>
          <div className="header-right">
            <input
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍  Search tasks…"
            />
            <button className="theme-toggle" onClick={() => setDarkMode((d) => !d)} title="Toggle dark mode">
              {darkMode ? "☀" : "🌙"}
            </button>
          </div>
        </header>

        <div className="add-task">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={columnOrder.length ? `New task → ${columnOrder[0]}…` : "Add a column first"}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>

        <div className="board-scroll">
          <div className="board">
            {columnOrder.map((col) => {
              const allTasks = board[col] ?? [];
              const tasks = allTasks.filter(matchesSearch);
              const colColor = getColumnColor(col);
              const isColBottom = dragOver?.column === col && dragOver.index >= allTasks.length;

              return (
                <div
                  key={col}
                  className="column"
                  style={{ "--col-color": colColor }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragOver || dragOver.column !== col || dragOver.index < allTasks.length)
                      setDragOver({ column: col, index: allTasks.length });
                  }}
                  onDrop={() => onDrop(col, allTasks.length)}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
                  }}
                >
                  <div className="column-header">
                    {renamingCol === col ? (
                      <input
                        className="col-rename-input"
                        autoFocus
                        defaultValue={col}
                        onBlur={(e) => renameColumn(col, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameColumn(col, e.target.value);
                          if (e.key === "Escape") setRenamingCol(null);
                        }}
                      />
                    ) : (
                      <h2 onDoubleClick={() => setRenamingCol(col)} title="Double-click to rename">
                        {col}
                        <span className="col-count">{allTasks.length}</span>
                      </h2>
                    )}
                    <button className="icon-btn danger col-del-btn" title="Delete column" onClick={() => deleteColumn(col)}>✕</button>
                  </div>

                  {tasks.map((task, index) => {
                    const overdue = isOverdue(task.dueDate);
                    const today = isDueToday(task.dueDate);
                    const checkDone = task.checklist?.filter((c) => c.done).length ?? 0;
                    const checkTotal = task.checklist?.length ?? 0;
                    const isDropHere = dragOver?.column === col && dragOver?.index === index;

                    return (
                      <div key={task.id}>
                        {isDropHere && <div className="drop-indicator" />}
                        <div
                          className={`card ${overdue ? "card-overdue" : ""} ${dragging?.task.id === task.id ? "card-dragging" : ""}`}
                          draggable
                          onDragStart={() => onDragStart(col, task, index)}
                          onDragEnd={() => { setDragging(null); setDragOver(null); }}
                          onDragOver={(e) => onDragOverCard(e, col, index)}
                          onDrop={(e) => { e.stopPropagation(); onDrop(col, index); }}
                          onClick={() => setSelectedTask({ column: col, task })}
                        >
                          <div className="card-top">
                            {task.priority && (
                              <span
                                className="priority-dot"
                                style={{ background: PRIORITY_CONFIG[task.priority].color }}
                                title={`${PRIORITY_CONFIG[task.priority].label} priority`}
                              />
                            )}
                            <span className="card-text">{task.text}</span>
                            <button
                              className="delete"
                              onClick={(e) => { e.stopPropagation(); deleteTask(col, task.id); }}
                            >✕</button>
                          </div>

                          {(task.dueDate || checkTotal > 0 || task.description) && (
                            <div className="card-meta">
                              {task.dueDate && (
                                <span className={`due-badge ${overdue ? "due-overdue" : today ? "due-today" : ""}`}>
                                  📅 {formatDate(task.dueDate)}
                                </span>
                              )}
                              {checkTotal > 0 && (
                                <span className={`check-badge ${checkDone === checkTotal ? "check-all-done" : ""}`}>
                                  ✓ {checkDone}/{checkTotal}
                                </span>
                              )}
                              {task.description && (
                                <span className="desc-badge" title="Has description">≡</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className={`col-drop-zone ${isColBottom ? "active" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver({ column: col, index: allTasks.length }); }}
                    onDrop={(e) => { e.stopPropagation(); onDrop(col, allTasks.length); }}
                  />
                </div>
              );
            })}

            {/* Add column */}
            <div className="column add-column-col">
              {addingColumn ? (
                <div className="add-col-form">
                  <input
                    autoFocus
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="Column name…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addColumn();
                      if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); }
                    }}
                  />
                  <div className="add-col-btns">
                    <button className="btn-primary" onClick={addColumn}>Add</button>
                    <button className="btn-ghost" onClick={() => { setAddingColumn(false); setNewColName(""); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="add-col-btn" onClick={() => setAddingColumn(true)}>+ Add column</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask.task}
          column={selectedTask.column}
          onClose={() => setSelectedTask(null)}
          onSave={(updated) => updateTask(selectedTask.column, updated)}
          onDelete={() => deleteTask(selectedTask.column, selectedTask.task.id)}
        />
      )}
    </div>
  );
}