package main

import (
	"encoding/json"
	"errors"
	"os"
)

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

var tasks []Task
var tasksFile = "tasks.json"

func nextID() int {
	max := 0
	for _, t := range tasks {
		if t.ID > max {
			max = t.ID
		}
	}
	return max + 1
}

func addTask(t Task) {
	tasks = append(tasks, t)
	saveTasksToFile()
}

func updateTask(id int, updated Task) error {
	for i, t := range tasks {
		if t.ID == id {
			updated.ID = id
			tasks[i] = updated
			saveTasksToFile()
			return nil
		}
	}
	return errors.New("tarefa não encontrada")
}

func deleteTask(id int) error {
	for i, t := range tasks {
		if t.ID == id {
			tasks = append(tasks[:i], tasks[i+1:]...)
			saveTasksToFile()
			return nil
		}
	}
	return errors.New("tarefa não encontrada")
}

func saveTasksToFile() {
	file, _ := os.Create(tasksFile)
	defer file.Close()
	json.NewEncoder(file).Encode(tasks)
}

func loadTasksFromFile() {
	file, err := os.Open(tasksFile)
	if err != nil {
		tasks = []Task{}
		return
	}
	defer file.Close()
	json.NewDecoder(file).Decode(&tasks)
}
