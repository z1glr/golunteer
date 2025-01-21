package events

import (
	"slices"

	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/assignments"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

type EventWithAssignment struct {
	eventDataDB
	Tasks []assignments.EventAssignment `json:"tasks"`
}

type EventWithAvailabilities struct {
	EventWithAssignment
	Availabilities map[string]string `json:"availabilities"`
}

type eventDataDB struct {
	ID          int    `db:"id" json:"id" validate:"required"`
	Date        string `db:"date" json:"date" validate:"required"`
	Description string `db:"description" json:"description"`
}

// transform the database-entry to an Event
func (e eventDataDB) Event() (EventWithAssignment, error) {
	// get the assignments associated with the event
	if assignemnts, err := assignments.Event(e.ID); err != nil {
		return EventWithAssignment{}, err
	} else {
		return EventWithAssignment{
			eventDataDB: e,
			Tasks:       assignemnts,
		}, nil
	}
}

func (e eventDataDB) EventWithAvailabilities() (EventWithAvailabilities, error) {
	// get the event with assignments
	if event, err := e.Event(); err != nil {
		return EventWithAvailabilities{}, err

		// get the availabilities
	} else if availabilities, err := availabilities.Event(e.ID); err != nil {
		return EventWithAvailabilities{}, err
	} else {
		return EventWithAvailabilities{
			EventWithAssignment: event,
			Availabilities:      availabilities,
		}, nil
	}
}

type EventCreate struct {
	Date        string `db:"date" json:"date" validate:"required"`
	Description string `db:"description" json:"description"`
	Tasks       []int  `json:"tasks" validate:"required,min=1"`
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
			db.DB.Query("DELETE FROM EVENTS WHERE id = ?", id)

			return err
		}
	}

	return nil
}

type EventPatch struct {
	eventDataDB
	Tasks []int `json:"tasks" validate:"required,min=1"`
}

func Update(event EventPatch) error {
	// update the event itself
	if _, err := db.DB.NamedExec("UPDATE EVENTS SET description = :description, date = :date WHERE id = :id", event); err != nil {
		return err

		// get the tasks currently assigned to the event
	} else {
		type TaskID struct {
			ID int `db:"taskID"`
		}

		var taskRows []TaskID

		if err := db.DB.Select(&taskRows, "SELECT taskID FROM USER_ASSIGNMENTS WHERE eventID = ?", event.ID); err != nil {
			return err
		} else {
			type Task struct {
				TaskID
				EventID int `db:"eventID"`
			}

			// extract the rows that need to be deleted
			deleteRows := []Task{}

			for _, row := range taskRows {
				if !slices.Contains(event.Tasks, row.ID) {
					deleteRows = append(deleteRows, Task{TaskID: row, EventID: event.ID})
				}
			}

			// extract the rows that need to be created
			createRows := []Task{}

			for _, id := range event.Tasks {
				if !slices.Contains(taskRows, TaskID{ID: id}) {
					createRows = append(createRows, Task{TaskID: TaskID{ID: id}, EventID: event.ID})
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

func All() ([]eventDataDB, error) {
	var dbRows []eventDataDB

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
				logger.Logger.Error().Msgf("can't get assignments for event with id = %d: %v", e.ID, err)
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
				logger.Logger.Error().Msgf("can't get availabilities for event with id = %d: %v", e.ID, err)
			} else {
				events[ii] = ev
			}
		}

		return events, nil
	}
}

func UserPending(userName string) (int, error) {
	var result struct {
		Count int `db:"count(*)"`
	}

	if err := db.DB.QueryRowx("SELECT count(*) FROM EVENTS WHERE NOT EXISTS (SELECT 1 FROM USER_AVAILABILITIES WHERE USER_AVAILABILITIES.eventID = EVENTS.id AND USER_AVAILABILITIES.userName = ?)", userName).StructScan(&result); err != nil {
		return 0, err
	} else {
		return result.Count, nil
	}
}

func Delete(eventId int) error {
	_, err := db.DB.Exec("DELETE FROM EVENTS WHERE id = ?", eventId)

	return err
}
