package tasks

import (
	"fmt"
	"time"

	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type tasksDB struct {
	ID      int    `db:"id"`
	Text    string `db:"text"`
	Enabled bool   `db:"enabled"`
}

type Task struct {
	Text    string `json:"text"`
	Enabled bool   `json:"enabled"`
}

var c *cache.Cache

func Get() (map[int]Task, error) {
	if tasks, hit := c.Get("tasks"); !hit {
		refresh()

		return nil, fmt.Errorf("tasks not stored cached")
	} else {
		return tasks.(map[int]Task), nil
	}
}

func refresh() {
	// get the tasksRaw from the database
	var tasksRaw []tasksDB

	if err := db.DB.Select(&tasksRaw, "SELECT * FROM TASKS"); err == nil {
		// convert the result in a map
		tasks := map[int]Task{}

		for _, a := range tasksRaw {
			tasks[a.ID] = Task{
				Text:    a.Text,
				Enabled: a.Enabled,
			}
		}

		c.Set("tasks", tasks)
	}
}

func init() {
	c = cache.New(24 * time.Hour)

	c.OnExpired(refresh)

	refresh()
}
