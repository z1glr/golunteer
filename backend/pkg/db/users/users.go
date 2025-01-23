package users

import (
	"github.com/google/uuid"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	UserName string `db:"userName" json:"userName"`
	Admin    bool   `db:"admin" json:"admin"`
}

type UserChangePassword struct {
	UserName string `json:"userName" validate:"required" db:"userName"`
	Password string `json:"password" validate:"required,min=12"`
}

// hashes a password
func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func Get() ([]User, error) {
	// get the users from the database
	var users []User

	if err := db.DB.Select(&users, "SELECT userName, admin FROM USERS"); err != nil {
		return nil, err
	} else {
		return users, nil
	}
}

func TokenID(userName string) (string, error) {
	var dbResult struct {
		TokenID string `db:"tokenID"`
	}

	err := db.DB.Get(&dbResult, "SELECT tokenID FROM USERS WHERE userName = ?", userName)

	return dbResult.TokenID, err
}

type UserAdd struct {
	UserName string `json:"userName" validate:"required" db:"userName"`
	Password string `json:"password" validate:"required,min=12,max=64"`
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

		_, err := db.DB.NamedExec("INSERT INTO USERS (userName, password, admin, tokenID) VALUES (:userName, :password, :admin, :tokenID)", insertUser)

		return err
	}
}

func ChangePassword(user UserChangePassword) (string, error) {
	// try to hash teh password
	if hash, err := hashPassword(user.Password); err != nil {
		return "", err
	} else {
		execStruct := struct {
			UserName string `db:"userName"`
			Password []byte `db:"password"`
			TokenID  string `db:"tokenID"`
		}{
			UserName: user.UserName,
			Password: hash,
			TokenID:  uuid.NewString(),
		}

		if _, err := db.DB.NamedExec("UPDATE USERS SET tokenID = :tokenID, password = :password WHERE name = :userName", execStruct); err != nil {
			return "", err
		} else {
			return execStruct.TokenID, nil
		}
	}
}

func ChangeName(userName, newName string) error {
	_, err := db.DB.Exec("UPDATE USERS SET userName = ? WHERE userName = ?", newName, userName)

	return err
}

func SetAdmin(userName string, admin bool) error {
	_, err := db.DB.Exec("UPDATE USERS SET admin = ? WHERE userName = ?", admin, userName)

	return err
}

func Delete(userName string) error {
	_, err := db.DB.Exec("DELETE FROM USERS WHERE userName = $1", userName)

	return err
}
