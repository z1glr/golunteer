package availabilites

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/users"
)

type eventAvailabilites struct {
	userName       string `db:"userName"`
	AvailabilityID int    `db:"availabilityID"`
}

func Event(eventID int) (map[string]string, error) {
	// get the availabilites for the event
	var availabilitesRows []eventAvailabilites

	if err := db.DB.Select(&availabilitesRows, "SELECT (userID, availabilityID) FROM USER_AVAILABILITES WHERE eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		// transform the result into a map
		eventAvailabilities := map[string]string{}

		// get the availabilites
		if availabilitesMap, err := Keys(); err != nil {
			return nil, err
		} else if usersMap, err := users.Get(); err != nil {
			return nil, err
		} else {
			for _, a := range availabilitesRows {
				eventAvailabilities[usersMap[a.userName].Name] = availabilitesMap[a.AvailabilityID].Text
			}

			return eventAvailabilities, nil
		}
	}
}
