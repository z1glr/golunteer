package availabilities

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type eventAvailabilities struct {
	UserName       string `db:"userName"`
	AvailabilityID int    `db:"availabilityID"`
}

type AvailabilityMap map[int][]string

func Event(eventID int) (AvailabilityMap, error) {
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
