package users

import (
	"github.com/google/uuid"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

type UserName string

type UserDB struct {
	UserName UserName `db:"userName" json:"userName"`
	Admin    bool     `db:"admin" json:"admin"`
}

type User struct {
	UserDB
	PossibleTasks []int `json:"possibleTasks"`
}

type UserChangePassword struct {
	UserName `json:"userName" validate:"required" db:"userName"`
	Password string `json:"password" validate:"required,min=12"`
}

// hashes a password
func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func Get() ([]User, error) {
	// get the usersDB from the database
	var usersDB []UserDB

	// get the users
	if err := db.DB.Select(&usersDB, "SELECT userName, admin FROM USERS"); err != nil {
		return nil, err
	} else {
		users := make([]User, len(usersDB))

		// for the individual users, get the possible tasks
		for ii, userDB := range usersDB {
			if user, err := userDB.ToUser(); err != nil {
				users = append(users[:ii], users[ii+1:]...)
			} else {
				users[ii] = user
			}
		}

		return users, nil
	}
}

func (userName UserName) TokenID() (string, error) {
	var dbResult struct {
		TokenID string `db:"tokenID"`
	}

	err := db.DB.Get(&dbResult, "SELECT tokenID FROM USERS WHERE userName = ?", userName)

	return dbResult.TokenID, err
}

type UserAdd struct {
	UserName      `json:"userName" validate:"required" db:"userName"`
	Password      string `json:"password" validate:"required,min=12,max=64"`
	Admin         bool   `json:"admin" db:"admin"`
	PossibleTasks []int  `json:"possibleTasks" validate:"required"`
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

		if _, err := db.DB.NamedExec("INSERT INTO USERS (userName, password, admin, tokenID) VALUES (:userName, :password, :admin, :tokenID)", insertUser); err != nil {
			return err
		}

		// set the possible Tasks
		for _, task := range user.PossibleTasks {
			if _, err := db.DB.Exec("INSERT INTO USER_TASKS (userName, taskID) VALUES ($1, $2)", user.UserName, task); err != nil {
				return err
			}
		}

		return err
	}
}

func Delete(userName string) error {
	_, err := db.DB.Exec("DELETE FROM USERS WHERE userName = $1", userName)

	return err
}

func (u *UserDB) ToUser() (User, error) {
	// get the possible tasks
	tasks := make([]int, 0)

	if err := db.DB.Select(&tasks, "SELECT taskID FROM USER_TASKS WHERE userName = $1", u.UserName); err != nil {
		return User{}, err
	} else {
		return User{
			UserDB:        *u,
			PossibleTasks: tasks,
		}, nil
	}
}
