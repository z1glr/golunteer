package events

import (
	"slices"

	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

type EventData struct {
	EventID     int    `db:"eventID" json:"eventID" validate:"required"`
	Date        string `db:"date" json:"date" validate:"required"`
	Description string `db:"description" json:"description"`
}

type EventPatch struct {
	EventData
	Tasks []int `json:"tasks" validate:"required,min=1"`
}

type EventAssignment struct {
	TaskID   int     `db:"taskID" json:"taskID"`
	TaskName string  `db:"taskName" json:"taskName"`
	UserName *string `db:"userName" json:"userName"`
}

type EventWithAssignment struct {
	EventData
	Tasks []EventAssignment `json:"tasks"`
}

type EventWithAvailabilities struct {
	EventWithAssignment
	Availabilities map[string]string `json:"availabilities"`
}

type EventCreate struct {
	Date        string `db:"date" json:"date" validate:"required,datetime=2006-01-02T15:04:05.999999999Z"`
	Description string `db:"description" json:"description"`
	Tasks       []int  `json:"tasks" validate:"required,min=1"`
}

// transform the database-entry to an Event
func (e EventData) Event() (EventWithAssignment, error) {
	// get the assignments associated with the event
	if assignemnts, err := Assignments(e.EventID); err != nil {
		return EventWithAssignment{}, err
	} else {
		return EventWithAssignment{
			EventData: e,
			Tasks:     assignemnts,
		}, nil
	}
}

func (e EventData) EventWithAvailabilities() (EventWithAvailabilities, error) {
	// get the event with assignments
	if event, err := e.Event(); err != nil {
		return EventWithAvailabilities{}, err

		// get the availabilities
	} else if availabilities, err := availabilities.Event(e.EventID); err != nil {
		return EventWithAvailabilities{}, err
	} else {
		return EventWithAvailabilities{
			EventWithAssignment: event,
			Availabilities:      availabilities,
		}, nil
	}
}

func Create(event EventCreate) error {
	// convert the date to utc
	if result, err := db.DB.NamedExec("INSERT INTO EVENTS (date, description) VALUES (:date, :description)", event); err != nil {
		return err
	} else if id, err := result.LastInsertId(); err != nil {
		return err
	} else {
		// create an insert-slice with the id included
		tasks := []struct {
			TaskID  int   `db:"taskID"`
			EventID int64 `db:"eventID"`
		}{}

		for _, taskID := range event.Tasks {
			tasks = append(tasks, struct {
				TaskID  int   "db:\"taskID\""
				EventID int64 "db:\"eventID\""
			}{
				TaskID:  taskID,
				EventID: id,
			})
		}

		// create the assignments
		if _, err := db.DB.NamedExec("INSERT INTO USER_ASSIGNMENTS (eventID, taskID) VALUES (:eventID, :taskID)", tasks); err != nil {
			// delete the event again
			db.DB.Query("DELETE FROM EVENTS WHERE eventID = ?", id)

			return err
		}
	}

	return nil
}

func Update(event EventPatch) error {
	// update the event itself
	if _, err := db.DB.NamedExec("UPDATE EVENTS SET description = :description, date = :date WHERE eventID = :id", event); err != nil {
		return err

		// get the tasks currently assigned to the event
	} else {
		type TaskID struct {
			TaskID int `db:"taskID"`
		}

		var taskRows []TaskID

		if err := db.DB.Select(&taskRows, "SELECT taskID FROM USER_ASSIGNMENTS WHERE eventID = $1", event.EventID); err != nil {
			return err
		} else {
			type Task struct {
				TaskID
				EventID int `db:"eventID"`
			}

			// extract the rows that need to be deleted
			deleteRows := []Task{}

			for _, row := range taskRows {
				if !slices.Contains(event.Tasks, row.TaskID) {
					deleteRows = append(deleteRows, Task{TaskID: row, EventID: event.EventID})
				}
			}

			// extract the rows that need to be created
			createRows := []Task{}

			for _, taskID := range event.Tasks {
				if !slices.Contains(taskRows, TaskID{TaskID: taskID}) {
					createRows = append(createRows, Task{TaskID: TaskID{TaskID: taskID}, EventID: event.EventID})
				}
			}

			// delete the no longer needed rows
			if len(deleteRows) > 0 {
				if _, err := db.DB.NamedExec("DELETE FROM USER_ASSIGNMENTS WHERE eventID = :eventID AND taskID = :taskID", deleteRows); err != nil {
					return err
				}
			}

			// create the new tasks
			if len(createRows) > 0 {
				if _, err := db.DB.NamedExec("INSERT INTO USER_ASSIGNMENTS (eventID, taskID) VALUES (:eventID, :taskID)", createRows); err != nil {
					return err
				}
			}

			return nil
		}
	}
}

func All() ([]EventData, error) {
	var dbRows []EventData

	if err := db.DB.Select(&dbRows, "SELECT * FROM EVENTS"); err != nil {
		return nil, err
	} else {
		return dbRows, nil
	}
}

func WithAssignments() ([]EventWithAssignment, error) {
	// get all events
	if eventsDB, err := All(); err != nil {
		return nil, err
	} else {
		events := make([]EventWithAssignment, len(eventsDB))

		for ii, e := range eventsDB {
			if ev, err := e.Event(); err != nil {
				logger.Logger.Error().Msgf("can't get assignments for event with assignmentID = %d: %v", e.EventID, err)
			} else {
				events[ii] = ev
			}
		}

		return events, nil
	}
}

func WithAvailabilities() ([]EventWithAvailabilities, error) {
	// get all events
	if eventsDB, err := All(); err != nil {
		return nil, err
	} else {
		events := make([]EventWithAvailabilities, len(eventsDB))

		for ii, e := range eventsDB {
			if ev, err := e.EventWithAvailabilities(); err != nil {
				logger.Logger.Error().Msgf("can't get availabilities for event with eventID = %d: %v", e.EventID, err)
			} else {
				events[ii] = ev
			}
		}

		return events, nil
	}
}

func UserPending(userName string) ([]EventData, error) {
	var result []EventData

	if err := db.DB.Select(&result, "SELECT eventID, date, description FROM EVENTS WHERE NOT EXISTS (SELECT 1 FROM USER_AVAILABILITIES WHERE USER_AVAILABILITIES.eventID = EVENTS.eventID AND USER_AVAILABILITIES.userName = ?)", userName); err != nil {
		return nil, err
	} else {
		return result, nil
	}
}

func UserPendingCount(userName string) (int, error) {
	var result struct {
		Count int `db:"count(*)"`
	}

	if err := db.DB.QueryRowx("SELECT count(*) FROM EVENTS WHERE NOT EXISTS (SELECT 1 FROM USER_AVAILABILITIES WHERE USER_AVAILABILITIES.eventID = EVENTS.eventID AND USER_AVAILABILITIES.userName = ?)", userName).StructScan(&result); err != nil {
		return 0, err
	} else {
		return result.Count, nil
	}
}

func Delete(eventId int) error {
	_, err := db.DB.Exec("DELETE FROM EVENTS WHERE eventID = ?", eventId)

	return err
}

func Assignments(eventID int) ([]EventAssignment, error) {
	// get the assignments from the database
	var assignmentRows []EventAssignment

	if err := db.DB.Select(&assignmentRows, "SELECT USERS.userName, TASKS.taskID, TASKS.taskName FROM USER_ASSIGNMENTS LEFT JOIN USERS ON USER_ASSIGNMENTS.userName = USERS.userName LEFT JOIN TASKS ON USER_ASSIGNMENTS.taskID = TASKS.taskID WHERE USER_ASSIGNMENTS.eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		return assignmentRows, nil
	}
}

func User(userName string) ([]EventWithAssignment, error) {
	// get all assignments of the user

	// var events []EventWithAssignment
	var events []struct {
		EventData
		TaskID   int    `db:"taskID"`
		UserName string `db:"userName"`
	}

	if err := db.DB.Select(&events, "SELECT DISTINCT * FROM USER_ASSIGNMENTS INNER JOIN EVENTS ON USER_ASSIGNMENTS.eventID = EVENTS.eventID WHERE userName = $1", userName); err != nil {
		return nil, err
	} else {
		return nil, nil
	}
}

// set the availability of an user for a specific event
func UserAvailability(userName string, eventID, availabilityID int) error {
	_, err := db.DB.Exec("INSERT INTO USER_AVAILABILITIES (userName, eventID, availabilityID) VALUES ($1, $2, $3) ON CONFLICT (userName, eventID) DO UPDATE SET availabilityID = $3", userName, eventID, availabilityID)

	return err
}
