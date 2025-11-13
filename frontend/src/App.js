// frontend/src/App.js
import React, { useEffect, useState, useRef } from "react";
import "./App.css";

const API = "http://localhost:8080/tasks";
const COLUMNS = [
  { id: "todo", title: "A Fazer" },
  { id: "doing", title: "Em Progresso" },
  { id: "done", title: "Concluídas" },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // task object being edited
  const dragged = useRef(null);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("failed to fetch");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");
    if (!newTitle.trim()) {
      setError("Título obrigatório");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          status: "todo",
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
      setNewDesc("");
    } catch (err) {
      setError("Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id) {
    setError("");
    if (!window.confirm("Confirma excluir esta tarefa?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Erro ao excluir");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError("Erro ao excluir");
    }
  }

  function startEdit(task) {
    setEditing({ ...task });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing || !editing.title.trim()) {
      setError("Título obrigatório");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("update failed");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditing(null);
    } catch (err) {
      setError("Erro ao salvar edição");
    } finally {
      setLoading(false);
    }
  }

  function onDragStart(e, task) {
    dragged.current = task;
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  async function onDrop(e, columnId) {
    e.preventDefault();
    const task = dragged.current;
    if (!task) return;
    if (task.status === columnId) {
      dragged.current = null;
      return;
    }
    const updated = { ...task, status: columnId };
    try {
      const res = await fetch(`${API}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("move failed");
      const upd = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === upd.id ? upd : t)));
    } catch {
      setError("Erro ao mover tarefa");
    } finally {
      dragged.current = null;
    }
  }

  function columnTasks(colId) {
    return tasks.filter((t) => t.status === colId);
  }

  return (
    <div className="App">
      <h1>Mini Kanban</h1>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">⏳ Carregando...</div>}

      <form onSubmit={createTask} className="new-task">
        <input
          placeholder="Título *"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={loading}
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          disabled={loading}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setNewTitle("");
              setNewDesc("");
              setError("");
            }}
            disabled={loading}
          >
            Limpar
          </button>
        </div>
      </form>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="column"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <h2>{col.title}</h2>

            {columnTasks(col.id).map((task) =>
              editing && editing.id === task.id ? (
                <div key={task.id} className="task edit-form">
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                  <div className="edit-buttons">
                    <button onClick={saveEdit} disabled={loading}>
                      Salvar
                    </button>
                    <button onClick={cancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div
                  key={task.id}
                  className="task"
                  draggable
                  onDragStart={(e) => onDragStart(e, task)}
                >
                  <strong>{task.title}</strong>
                  {task.description && <p className="desc">{task.description}</p>}
                  <div className="task-buttons">
                    <button onClick={() => startEdit(task)}>✏️</button>
                    <button onClick={() => deleteTask(task.id)}>🗑️</button>
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
