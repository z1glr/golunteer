package availabilities

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type AvailabilityDB struct {
	Id int `db:"id" json:"id" validate:"required"`
	Availability
}

type Availability struct {
	Text    string `db:"text" json:"text" validate:"required"`
	Enabled bool   `db:"enabled" json:"enabled" validate:"required"`
	Color   string `db:"color" json:"color" validate:"required"`
}

func Add(a Availability) error {
	_, err := db.DB.NamedExec("INSERT INTO AVAILABILITIES (text, color, enabled) VALUES (:text, :color, :enabled)", a)

	return err
}

func Update(a AvailabilityDB) error {
	_, err := db.DB.NamedExec("UPDATE AVAILABILITIES SET text = :text, color = :color, enabled = :enabled WHERE id = :id", a)

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
				Text:    a.Text,
				Enabled: a.Enabled,
				Color:   a.Color,
			}
		}

		return availabilities, nil
	}
}
