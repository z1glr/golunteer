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

type EventWithAssignments struct {
	EventData
	Tasks []EventAssignment `json:"tasks"`
}

type EventWithAvailabilities struct {
	EventWithAssignments
	Availabilities availabilities.AvailabilityMap `json:"availabilities"`
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
	if assignemnts, err := Assignments(e.EventID); err != nil {
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

func (e EventData) WithAvailabilities() (EventWithAvailabilities, error) {
	// get the event with assignments
	if event, err := e.WithAssignments(); err != nil {
		return EventWithAvailabilities{}, err

		// get the availabilities
	} else if availabilities, err := availabilities.Event(e.EventID); err != nil {
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

func GetUserAvailability(eventID int, userName string) (*availabilities.AvailabilityID, error) {
	var availabilityID struct {
		AvailabilityID *availabilities.AvailabilityID `db:"availabilityID"`
	}

	if err := db.DB.QueryRowx("SELECT availabilityID FROM USER_AVAILABILITIES WHERE eventID = $1 AND userName = $2", eventID, userName).StructScan(&availabilityID); err != nil {
		return availabilityID.AvailabilityID, err
	} else {
		return availabilityID.AvailabilityID, nil
	}
}

func WithUserAvailability(userName string) ([]EventWithAssignmentsUserAvailability, error) {
	var events []EventWithAssignmentsUserAvailability

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

func User(userName string) ([]EventWithAssignments, error) {
	// get all assignments of the user

	// var eventsDB []EventWithAssignment
	var eventsDB []EventData

	// get all the events where the volunteer is assigned a task
	if err := db.DB.Select(&eventsDB, "SELECT DISTINCT EVENTS.date, EVENTS.description, EVENTS.eventID FROM USER_ASSIGNMENTS INNER JOIN EVENTS ON USER_ASSIGNMENTS.eventID = EVENTS.eventID WHERE userName = $1", userName); err != nil {
		return nil, err
	} else {
		// for each event create an event with assignments
		events := make([]EventWithAssignments, len(eventsDB))

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
func SetUserAvailability(eventID, availabilityID int, userName string) error {
	_, err := db.DB.Exec("INSERT INTO USER_AVAILABILITIES (userName, eventID, availabilityID) VALUES ($1, $2, $3) ON CONFLICT (userName, eventID) DO UPDATE SET availabilityID = $3", userName, eventID, availabilityID)

	return err
}

// set the assignment of an user to a task for a specific event
func SetAssignment(eventID, taskID int, userName string) error {
	_, err := db.DB.Exec("UPDATE USER_ASSIGNMENTS SET userName = $1 WHERE eventID = $2 AND taskID = $3", userName, eventID, taskID)

	return err
}

// remove the assignment of an user
func DeleteAssignment(eventID, taskID int) error {
	_, err := db.DB.Exec("UPDATE USER_ASSIGNMENTS SET userName = null WHERE eventID = $1 AND taskID = $2", eventID, taskID)

	return err
}
