package users

import (
	"github.com/google/uuid"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

func (userName UserName) WithUserAvailability() ([]events.EventWithAssignmentsUserAvailability, error) {
	var events []events.EventWithAssignmentsUserAvailability

	if err := db.DB.Select(&events, "SELECT EVENTS.eventID, EVENTS.description, EVENTS.date, USER_AVAILABILITIES.availabilityID FROM EVENTS LEFT JOIN USER_AVAILABILITIES ON EVENTS.eventID = USER_AVAILABILITIES.eventID AND USER_AVAILABILITIES.userName = $1", userName); err != nil {
		return nil, err
	} else {
		// get the assignments for every event
		for ii, event := range events {
			if eventWithAssignments, err := event.EventWithAssignments.EventData.WithAssignments(); err != nil {
				// remove the current event from the events
				events = append(events[:ii], events[ii+1:]...)
			} else {
				events[ii].EventWithAssignments = eventWithAssignments
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
			UserName `db:"userName"`
			Password []byte `db:"password"`
			TokenID  string `db:"tokenID"`
		}{
			UserName: userName,
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

func (userName UserName) SetTasks(tasks []int) error {
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

func (userName UserName) UserPending() ([]events.EventData, error) {
	var result []events.EventData

	if err := db.DB.Select(&result, "SELECT eventID, date, description FROM EVENTS WHERE NOT EXISTS (SELECT 1 FROM USER_AVAILABILITIES WHERE USER_AVAILABILITIES.eventID = EVENTS.eventID AND USER_AVAILABILITIES.userName = ?)", userName); err != nil {
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
	if err := db.DB.Select(&eventsDB, "SELECT DISTINCT EVENTS.date, EVENTS.description, EVENTS.eventID FROM USER_ASSIGNMENTS INNER JOIN EVENTS ON USER_ASSIGNMENTS.eventID = EVENTS.eventID WHERE userName = $1", userName); err != nil {
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
