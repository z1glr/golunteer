package tasks

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type TaskDB struct {
	TaskID int `json:"taskID" db:"taskID" validate:"required"`
	Task   `valdate:"required" `
}

type Task struct {
	TaskName string `json:"taskName" db:"taskName" validate:"required"`
	Enabled  bool   `json:"enabled" db:"enabled" validate:"required"`
}

func GetSlice() ([]TaskDB, error) {
	var tasksRaw []TaskDB

	if err := db.DB.Select(&tasksRaw, "SELECT * FROM TASKS"); err != nil {
		return nil, err
	} else {
		return tasksRaw, nil
	}

}

func GetMap() (map[int]Task, error) {
	if tasksRaw, err := GetSlice(); err != nil {
		return nil, err
	} else {
		// convert the result in a map
		tasks := map[int]Task{}

		for _, a := range tasksRaw {
			tasks[a.TaskID] = Task{
				TaskName: a.TaskName,
				Enabled:  a.Enabled,
			}
		}

		return tasks, nil
	}
}

func Add(t Task) error {
	_, err := db.DB.NamedExec("INSERT INTO TASKS (taskName, enabled) VALUES (:taskName, :enabled)", &t)

	return err
}

func Update(t TaskDB) error {
	_, err := db.DB.NamedExec("UPDATE TASKS set taskName = :taskName, enabled = :enabled WHERE taskID = :taskID", &t)

	return err
}

func Delete(i int) error {
	_, err := db.DB.Exec("DELETE FROM TASKS WHERE taskID = $1", i)

	return err
}
