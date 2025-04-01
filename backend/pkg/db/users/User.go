package users

import (
	"github.com/google/uuid"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/tasks"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
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
	UserName UserName `json:"userName" validate:"required" db:"userName"`
	Password string   `json:"password" validate:"required,min=12"`
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
	UserName      UserName       `json:"userName" validate:"required" db:"userName"`
	Password      string         `json:"password" validate:"required,min=12,max=64"`
	Admin         bool           `json:"admin" db:"admin"`
	PossibleTasks []tasks.TaskID `json:"possibleTasks" validate:"required"`
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

func (userName UserName) WithUserAvailability() ([]events.EventWithAssignmentsUserAvailability, error) {
	var events []events.EventWithAssignmentsUserAvailability

	if err := db.DB.Select(&events, "SELECT EVENTS.eventID, EVENTS.description, EVENTS.date, USER_AVAILABILITIES.availabilityID FROM EVENTS LEFT JOIN USER_AVAILABILITIES ON EVENTS.eventID = USER_AVAILABILITIES.eventID AND USER_AVAILABILITIES.userName = $1 ORDER BY date", userName); err != nil {
		return nil, err
	} else {
		// get the assignments for every event
		for ii, event := range events {
			if eventWithAssignments, err := event.EventWithAssignments.EventData.WithAvailabilities(); err != nil {
				// remove the current event from the events
				events = append(events[:ii], events[ii+1:]...)
			} else {
				events[ii].EventWithAvailabilities = eventWithAssignments
			}
		}

		return events, nil
	}
}

func (userName UserName) ChangeName(newName UserName) error {
	_, err := db.DB.Exec("UPDATE USERS SET userName = ? WHERE userName = ?", newName, userName)

	return err
}

func (userName UserName) SetAdmin(admin bool) error {
	_, err := db.DB.Exec("UPDATE USERS SET admin = ? WHERE userName = ?", admin, userName)

	return err
}

func (userName UserName) ChangePassword(password string) (string, error) {
	// try to hash teh password
	if hash, err := hashPassword(password); err != nil {
		return "", err
	} else {
		execStruct := struct {
			UserName UserName `db:"userName"`
			Password []byte   `db:"password"`
			TokenID  string   `db:"tokenID"`
		}{
			UserName: userName,
			Password: hash,
			TokenID:  uuid.NewString(),
		}

		if _, err := db.DB.NamedExec("UPDATE USERS SET tokenID = :tokenID, password = :password WHERE userName = :userName", execStruct); err != nil {
			return "", err
		} else {
			return execStruct.TokenID, nil
		}
	}
}

func (userName UserName) GetTasks() ([]tasks.TaskID, error) {
	var tasks []tasks.TaskID

	err := db.DB.Select(&tasks, "SELECT taskID FROM USER_TASKS WHERE userName = $1", userName)

	return tasks, err
}

func (userName UserName) SetTasks(tasks []tasks.TaskID) error {
	// remove all current possible tasks
	if _, err := db.DB.Exec("DELETE FROM USER_TASKS WHERE userName = $1", userName); err != nil {
		return err

		// set the new tasks
	} else {
		for _, task := range tasks {
			if _, err := db.DB.Exec("INSERT INTO USER_TASKS (userName, taskID) VALUES ($1, $2)", userName, task); err != nil {
				return err
			}
		}

		return nil
	}
}

func (userName UserName) CheckTask(taskID tasks.TaskID) (bool, error) {
	var check bool

	if err := db.DB.Get(&check, "SELECT 1 FROM USER_TASKS WHERE userName = $1 AND taskID = $2", userName, taskID); err != nil {
		return false, err
	} else {
		return check, nil
	}
}

func (userName UserName) UserPending() ([]events.EventData, error) {
	var result []events.EventData

	if err := db.DB.Select(&result, `SELECT eventID, date, description
	FROM EVENTS
	WHERE NOT EXISTS (
		SELECT 1
		FROM USER_AVAILABILITIES
		WHERE USER_AVAILABILITIES.eventID = EVENTS.eventID
		AND USER_AVAILABILITIES.userName = $1
	)
	AND EXISTS (
		SELECT 1
		FROM USER_TASKS
		JOIN USER_ASSIGNMENTS ON USER_TASKS.taskID = USER_ASSIGNMENTS.taskID
		WHERE USER_TASKS.userName = $1
		AND USER_ASSIGNMENTS.eventID = EVENTS.eventID
	)
	AND date > datetime('now')`, userName); err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func (userName UserName) UserPendingCount() (int, error) {
	var result struct {
		Count int `db:"count(*)"`
	}

	if err := db.DB.QueryRowx("SELECT count(*) FROM EVENTS WHERE NOT EXISTS (SELECT 1 FROM USER_AVAILABILITIES WHERE USER_AVAILABILITIES.eventID = EVENTS.eventID AND USER_AVAILABILITIES.userName = ?)", userName).StructScan(&result); err != nil {
		return 0, err
	} else {
		return result.Count, nil
	}
}

func (userName UserName) GetAssignedEvents() ([]events.EventWithAssignments, error) {
	// get all assignments of the user

	// var eventsDB []EventWithAssignment
	var eventsDB []events.EventData

	// get all the events where the volunteer is assigned a task
	if err := db.DB.Select(&eventsDB, "SELECT DISTINCT EVENTS.date, EVENTS.description, EVENTS.eventID FROM USER_ASSIGNMENTS INNER JOIN EVENTS ON USER_ASSIGNMENTS.eventID = EVENTS.eventID WHERE userName = $1 AND EVENTS.date > datetime('now') ORDER BY EVENTS.date", userName); err != nil {
		return nil, err
	} else {
		// for each event create an event with assignments
		events := make([]events.EventWithAssignments, len(eventsDB))

		for ii, event := range eventsDB {
			if eventsWithAssignment, err := event.WithAssignments(); err != nil {
				logger.Logger.Error().Msgf("can't get assignments for event with eventID = %d: %v", event.EventID, err)

				// remove the last element from the return-slice, since there is now one element less
				if len(events) > 0 {
					events = events[:len(events)-1]
				}
			} else {
				events[ii] = eventsWithAssignment
			}
		}

		return events, nil
	}
}

// set the availability of an user for a specific event
func (userName UserName) SetEventAvailability(eventID, availabilityID int) error {
	_, err := db.DB.Exec("INSERT INTO USER_AVAILABILITIES (userName, eventID, availabilityID) VALUES ($1, $2, $3) ON CONFLICT (userName, eventID) DO UPDATE SET availabilityID = $3", userName, eventID, availabilityID)

	return err
}

func (userName UserName) GetUserAvailability(eventID events.EventID) (*availabilities.AvailabilityID, error) {
	var availabilityID struct {
		AvailabilityID *availabilities.AvailabilityID `db:"availabilityID"`
	}

	if err := db.DB.QueryRowx("SELECT availabilityID FROM USER_AVAILABILITIES WHERE eventID = $1 AND userName = $2", eventID, userName).StructScan(&availabilityID); err != nil {
		return availabilityID.AvailabilityID, err
	} else {
		return availabilityID.AvailabilityID, nil
	}
}
