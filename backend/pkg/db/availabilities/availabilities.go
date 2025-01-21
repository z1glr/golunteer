package availabilities

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type AvailabilityDB struct {
	Id           int `db:"id" json:"id" validate:"required"`
	Availability `validate:"required"`
}

type Availability struct {
	Name    string `db:"name" json:"name" validate:"required"`
	Enabled bool   `db:"enabled" json:"enabled" validate:"required"`
	Color   string `db:"color" json:"color" validate:"required"`
}

func Add(a Availability) error {
	_, err := db.DB.NamedExec("INSERT INTO AVAILABILITIES (name, color, enabled) VALUES (:name, :color, :enabled)", a)

	return err
}

func Update(a AvailabilityDB) error {
	_, err := db.DB.NamedExec("UPDATE AVAILABILITIES SET name = :name, color = :color, enabled = :enabled WHERE id = :id", a)

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

func Keys() (map[int]Availability, error) {
	if availabilitiesRaw, err := Slice(); err != nil {
		return nil, err
	} else {
		// convert the result in a map
		availabilities := map[int]Availability{}

		for _, a := range availabilitiesRaw {
			availabilities[a.Id] = Availability{
				Name:    a.Name,
				Enabled: a.Enabled,
				Color:   a.Color,
			}
		}

		return availabilities, nil
	}
}

func Delete(id int) error {
	_, err := db.DB.Exec("DELETE FROM AVAILABILITIES WHERE id = $1", id)

	return err
}
