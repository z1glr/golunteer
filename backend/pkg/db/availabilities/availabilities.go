package availabilities

import "github.com/johannesbuehl/golunteer/backend/pkg/db"

type AvailabilityID int

type AvailabilityDB struct {
	AvailabilityID AvailabilityID `db:"availabilityID" json:"availabilityID" validate:"required"`
	Availability   `validate:"required"`
}

type Availability struct {
	AvailabilityName string `db:"availabilityName" json:"availabilityName" validate:"required"`
	Enabled          bool   `db:"enabled" json:"enabled"`
	Color            string `db:"color" json:"color" validate:"required"`
}

func Add(a Availability) error {
	_, err := db.DB.NamedExec("INSERT INTO AVAILABILITIES (availabilityName, color, enabled) VALUES (:availabilityName, :color, :enabled)", a)

	return err
}

func Update(a AvailabilityDB) error {
	_, err := db.DB.NamedExec("UPDATE AVAILABILITIES SET availabilityName = :availabilityName, color = :color, enabled = :enabled WHERE availabilityID = :availabilityID", a)

	return err
}

func Slice() ([]AvailabilityDB, error) {
	// get the availabilitiesRaw from the database
	var availabilitiesRaw []AvailabilityDB

	if err := db.DB.Select(&availabilitiesRaw, "SELECT * FROM AVAILABILITIES"); err != nil {
		return nil, err
	} else {
		return availabilitiesRaw, nil
	}
}

func Keys() (map[AvailabilityID]Availability, error) {
	if availabilitiesRaw, err := Slice(); err != nil {
		return nil, err
	} else {
		// convert the result in a map
		availabilities := map[AvailabilityID]Availability{}

		for _, a := range availabilitiesRaw {
			availabilities[a.AvailabilityID] = Availability{
				AvailabilityName: a.AvailabilityName,
				Enabled:          a.Enabled,
				Color:            a.Color,
			}
		}

		return availabilities, nil
	}
}

func Delete(id int) error {
	_, err := db.DB.Exec("DELETE FROM AVAILABILITIES WHERE availabilityID = $1", id)

	return err
}
