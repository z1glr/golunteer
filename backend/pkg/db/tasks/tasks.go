package tasks

import (
	"fmt"
	"time"

	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type tasksDB struct {
	Id       int    `db:"id"`
	Text     string `db:"text"`
	Disabled bool   `db:"disabled"`
}

type Task struct {
	Text     string `json:"text"`
	Disabled bool   `json:"disabled"`
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
			tasks[a.Id] = Task{
				Text:     a.Text,
				Disabled: a.Disabled,
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
