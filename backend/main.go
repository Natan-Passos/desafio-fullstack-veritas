package main

import (
	"log"
	"net/http"
)

func main() {
	loadTasksFromFile() // tenta carregar do arquivo JSON

	http.HandleFunc("/tasks", handleTasks)
	http.HandleFunc("/tasks/", handleTaskByID)

	log.Println("🚀 Servidor rodando em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
