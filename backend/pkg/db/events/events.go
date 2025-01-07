package events

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/assignments"
)

type Event struct {
	eventDataDB
	Tasks       []string
	Assignments map[string]string
}

type eventDataDB struct {
	Id          int    `db:"id"`
	Date        string `db:"date"`
	Description string `db:"description"`
}

// transform the database-entry to an Event
func (e *eventDataDB) Event() (Event, error) {
	// get the availabilites associated with the event
	if assignemnts, err := assignments.Event(e.Id); err != nil {
		return Event{}, err
	} else {
		return Event{
			eventDataDB: *e,
			Assignments: assignemnts,
		}, nil
	}
}

// get all the event ids
func All() (map[int]eventDataDB, error) {
	var dbRows []eventDataDB

	if err := db.DB.Select(&dbRows, "SELECT * FROM EVENTS"); err != nil {
		return nil, err
	} else {
		eventsMap := map[int]eventDataDB{}

		for _, idRow := range dbRows {
			eventsMap[idRow.Id] = idRow
		}

		return eventsMap, nil
	}
}
