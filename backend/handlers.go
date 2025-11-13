package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func handleTasks(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)

	switch r.Method {
	case http.MethodGet:
		json.NewEncoder(w).Encode(tasks)

	case http.MethodPost:
		var t Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			http.Error(w, "erro ao decodificar JSON", http.StatusBadRequest)
			return
		}

		if strings.TrimSpace(t.Title) == "" {
			http.Error(w, "título é obrigatório", http.StatusBadRequest)
			return
		}
		if t.Status == "" {
			t.Status = "todo"
		}

		t.ID = nextID()
		addTask(t)

		json.NewEncoder(w).Encode(t)

	default:
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
	}
}

func handleTaskByID(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	idStr := strings.TrimPrefix(r.URL.Path, "/tasks/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var updated Task
		if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
			http.Error(w, "erro ao decodificar JSON", http.StatusBadRequest)
			return
		}
		if err := updateTask(id, updated); err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(updated)

	case http.MethodDelete:
		if err := deleteTask(id); err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
	}
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}
