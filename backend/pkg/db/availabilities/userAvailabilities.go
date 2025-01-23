package availabilities

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type eventAvailabilities struct {
	UserName       string `db:"userName"`
	AvailabilityID int    `db:"availabilityID"`
}

func Event(eventID int) (map[string]string, error) {
	// get the availabilities for the event
	var availabilitiesRows []eventAvailabilities

	if err := db.DB.Select(&availabilitiesRows, "SELECT userName, availabilityID FROM USER_AVAILABILITIES WHERE eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		// transform the result into a map
		eventAvailabilities := map[string]string{}

		// get the availabilities
		if availabilitiesMap, err := Keys(); err != nil {
			return nil, err
		} else {
			for _, a := range availabilitiesRows {
				eventAvailabilities[a.UserName] = availabilitiesMap[a.AvailabilityID].AvailabilityName
			}

			return eventAvailabilities, nil
		}
	}
}
