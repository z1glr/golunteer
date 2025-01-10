package events

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/assignments"
	"github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

type EventWithAssignment struct {
	eventDataDB
	Tasks map[string]*string `json:"tasks"`
}

type eventDataDB struct {
	Id          int    `db:"id" json:"id"`
	Date        string `db:"date" json:"date"`
	Description string `db:"description" json:"description"`
}

// transform the database-entry to an Event
func (e *eventDataDB) Event() (EventWithAssignment, error) {
	// get the availabilites associated with the event
	if assignemnts, err := assignments.Event(e.Id); err != nil {
		return EventWithAssignment{}, err
	} else {
		return EventWithAssignment{
			eventDataDB: *e,
			Tasks:       assignemnts,
		}, nil
	}
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

func UserPending(userName string) (int, error) {
	var result struct {
		Count int `db:"count(*)"`
	}

	if err := db.DB.QueryRowx("SELECT count(*) FROM USERS WHERE name = ? AND name NOT IN (SELECT userName FROM USER_AVAILABILITIES)", userName).StructScan(&result); err != nil {
		return 0, err
	} else {
		return result.Count, nil
	}
}
