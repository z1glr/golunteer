package events

import (
	"slices"

	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

// empty UserName interface so that the functions of this package can accept UserName variables without a circular import
type UserName interface{}
type TaskID interface{}

type EventID int

type eventAvailabilities struct {
	UserName       string `db:"userName"`
	AvailabilityID int    `db:"availabilityID"`
}

type AvailabilityMap map[int][]string

type EventData struct {
	EventID     EventID `db:"eventID" json:"eventID" validate:"required"`
	Date        string  `db:"date" json:"date" validate:"required"`
	Description string  `db:"description" json:"description"`
}

type EventPatch struct {
	EventData
	Tasks []int `json:"tasks" validate:"required,min=1"`
}

type EventAssignment struct {
	TaskID   TaskID  `db:"taskID" json:"taskID"`
	TaskName string  `db:"taskName" json:"taskName"`
	UserName *string `db:"userName" json:"userName"`
}

type EventWithAssignments struct {
	EventData
	Tasks []EventAssignment `json:"tasks"`
}

type EventWithAvailabilities struct {
	EventWithAssignments
	Availabilities AvailabilityMap `json:"availabilities"`
}

type EventWithAssignmentsUserAvailability struct {
	EventWithAssignments
	Availability *int `json:"availability" db:"availabilityID"`
}

type EventCreate struct {
	Date        string `db:"date" json:"date" validate:"required,datetime=2006-01-02T15:04:05.999999999Z"`
	Description string `db:"description" json:"description"`
	Tasks       []int  `json:"tasks" validate:"required,min=1"`
}

// transform the database-entry to an WithAssignments
func (e EventData) WithAssignments() (EventWithAssignments, error) {
	// get the assignments associated with the event
	if assignemnts, err := e.EventID.Assignments(); err != nil {
		return EventWithAssignments{}, err
	} else {
		return EventWithAssignments{
			EventData: e,
			Tasks:     assignemnts,
		}, nil
	}
}

func (e EventWithAssignments) WithUserAvailability(userName string) (EventWithAssignmentsUserAvailability, error) {
	// get the availability of the user
	event := EventWithAssignmentsUserAvailability{
		EventWithAssignments: e,
	}

	if err := db.DB.Select(&event, "SELECT availabilityID FROM USER_AVAILABILITIES WHERE eventID = $1 AND userName = $2", e.EventID, userName); err != nil {
		return EventWithAssignmentsUserAvailability{}, err
	} else {
		return event, nil
	}
}

func (eventID EventID) Availabilities() (AvailabilityMap, error) {
	// get the availabilities for the event
	var availabilitiesRows []eventAvailabilities

	if err := db.DB.Select(&availabilitiesRows, "SELECT userName, availabilityID FROM USER_AVAILABILITIES WHERE eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		// transform the result into a map
		eventAvailabilities := AvailabilityMap{}

		// get the availabilities
		for _, a := range availabilitiesRows {
			// if there is no slice for this availability, create it
			if _, exists := eventAvailabilities[a.AvailabilityID]; !exists {
				eventAvailabilities[a.AvailabilityID] = make([]string, 0)
			}

			eventAvailabilities[a.AvailabilityID] = append(eventAvailabilities[a.AvailabilityID], a.UserName)
		}

		return eventAvailabilities, nil
	}
}

func (e EventData) WithAvailabilities() (EventWithAvailabilities, error) {
	// get the event with assignments
	if event, err := e.WithAssignments(); err != nil {
		return EventWithAvailabilities{}, err

		// get the availabilities
	} else if availabilities, err := e.EventID.Availabilities(); err != nil {
		return EventWithAvailabilities{}, err
	} else {
		return EventWithAvailabilities{
			EventWithAssignments: event,
			Availabilities:       availabilities,
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
				EventID EventID `db:"eventID"`
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

func WithAssignments() ([]EventWithAssignments, error) {
	// get all events
	if eventsDB, err := All(); err != nil {
		return nil, err
	} else {
		events := make([]EventWithAssignments, len(eventsDB))

		for ii, e := range eventsDB {
			if ev, err := e.WithAssignments(); err != nil {
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
			if ev, err := e.WithAvailabilities(); err != nil {
				logger.Logger.Error().Msgf("can't get availabilities for event with eventID = %d: %v", e.EventID, err)

				// remove the last element from the return-slice, since there is now one element less
				if len(events) > 0 {
					events = events[:len(events)-1]
				}

			} else {
				events[ii] = ev
			}
		}

		return events, nil
	}
}

func Delete(eventId int) error {
	_, err := db.DB.Exec("DELETE FROM EVENTS WHERE eventID = ?", eventId)

	return err
}

func (eventID EventID) Assignments() ([]EventAssignment, error) {
	// get the assignments from the database
	var assignmentRows []EventAssignment

	if err := db.DB.Select(&assignmentRows, "SELECT USERS.userName, TASKS.taskID, TASKS.taskName FROM USER_ASSIGNMENTS LEFT JOIN USERS ON USER_ASSIGNMENTS.userName = USERS.userName LEFT JOIN TASKS ON USER_ASSIGNMENTS.taskID = TASKS.taskID WHERE USER_ASSIGNMENTS.eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		return assignmentRows, nil
	}
}

// set the assignment of an user to a task for a specific event
func (eventID EventID) SetAssignment(taskID TaskID, userName UserName) error {
	_, err := db.DB.Exec("UPDATE USER_ASSIGNMENTS SET userName = $1 WHERE eventID = $2 AND taskID = $3", userName, eventID, taskID)

	return err
}

// remove the assignment of an user
func DeleteAssignment(eventID, taskID int) error {
	_, err := db.DB.Exec("UPDATE USER_ASSIGNMENTS SET userName = null WHERE eventID = $1 AND taskID = $2", eventID, taskID)

	return err
}
