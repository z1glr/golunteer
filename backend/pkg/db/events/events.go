package events

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/assignments"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

type EventWithAssignment struct {
	eventDataDB
	Tasks map[string]*string `json:"tasks"`
}

type EventWithAvailabilities struct {
	EventWithAssignment
	Availabilities map[string]string `json:"availabilities"`
}

type eventDataDB struct {
	Id          int    `db:"id" json:"id"`
	Date        string `db:"date" json:"date" validate:"required"`
	Description string `db:"description" json:"description"`
}

// transform the database-entry to an Event
func (e eventDataDB) Event() (EventWithAssignment, error) {
	// get the assignments associated with the event
	if assignemnts, err := assignments.Event(e.Id); err != nil {
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
	} else if availabilities, err := availabilities.Event(e.Id); err != nil {
		return EventWithAvailabilities{}, err
	} else {
		return EventWithAvailabilities{
			EventWithAssignment: event,
			Availabilities:      availabilities,
		}, nil
	}
}

type EventCreate struct {
	eventDataDB
	Tasks []int `json:"tasks" validate:"required,min=1"`
}

func Create(event EventCreate) error {
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

func All() ([]eventDataDB, error) {
	var dbRows []eventDataDB

	if err := db.DB.Select(&dbRows, "SELECT *, DATE_FORMAT(date, '%Y-%m-%dT%H:%i:%s') as date FROM EVENTS"); err != nil {
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
				logger.Logger.Error().Msgf("can't get assignments for event with id = %d: %v", e.Id, err)
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
				logger.Logger.Error().Msgf("can't get availabilities for event with id = %d: %v", e.Id, err)
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
