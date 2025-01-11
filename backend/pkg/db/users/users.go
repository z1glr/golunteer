package users

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Name     string `db:"name"`
	Password []byte `db:"password"`
	TokenID  string `db:"tokenID"`
	Admin    bool   `db:"admin"`
}

var c *cache.Cache

// hashes a password
func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

// validates a password against the password-rules
func ValidatePassword(password string) bool {
	return len(password) >= 12 && len(password) <= 64
}

func Get() (map[string]User, error) {
	if users, hit := c.Get("users"); !hit {
		refresh()

		return nil, fmt.Errorf("users not cached")
	} else {
		return users.(map[string]User), nil
	}
}

type UserAdd struct {
	UserName string `json:"userName" validate:"required" db:"userName"`
	Password string `json:"password" validate:"required,min=8"`
	Admin    bool   `json:"admin" db:"admin"`
}

func Add(user UserAdd) error {
	// try to hash the password
	if hash, err := hashPassword(user.Password); err != nil {
		return err
	} else {
		insertUser := struct {
			UserAdd
			Password []byte `db:"password"`
			TokenID  string `db:"tokenID"`
		}{
			UserAdd:  user,
			Password: hash,
			TokenID:  uuid.NewString(),
		}

		if _, err := db.DB.NamedExec("INSERT INTO USERS (name, password, admin, tokenID) VALUES (:userName, :password, :admin, :tokenID)", insertUser); err != nil {
			return err
		} else {
			refresh()

			return nil
		}
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
