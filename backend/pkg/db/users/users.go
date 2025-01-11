package users

import (
	"fmt"
	"time"

	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type User struct {
	Name     string `db:"name"`
	Password []byte `db:"password"`
	TokenID  string `db:"tokenID"`
	Admin    bool   `db:"admin"`
}

var c *cache.Cache

func Get() (map[string]User, error) {
	if users, hit := c.Get("users"); !hit {
		refresh()

		return nil, fmt.Errorf("users not cached")
	} else {
		return users.(map[string]User), nil
	}
}

func refresh() {
	// get the usersRaw from the database
	var usersRaw []User

	if err := db.DB.Select(&usersRaw, "SELECT * FROM USERS"); err == nil {
		// convert the result in a map
		users := map[string]User{}

		for _, user := range usersRaw {
			users[user.Name] = user
		}

		c.Set("users", users)
	}
}

func init() {
	c = cache.New(24 * time.Hour)

	c.OnExpired(refresh)

	refresh()
}
