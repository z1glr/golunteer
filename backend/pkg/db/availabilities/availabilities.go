package availabilities

import (
	"fmt"
	"time"

	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type availabilitiesDB struct {
	Id       int    `db:"id"`
	Text     string `db:"text"`
	Disabled bool   `db:"disabled"`
}

type Availability struct {
	Text     string
	Disabled bool
}

var c *cache.Cache

func Keys() (map[int]Availability, error) {
	if availabilities, hit := c.Get("availabilities"); !hit {
		refresh()

		return nil, fmt.Errorf("availabilities not stored cached")
	} else {
		return availabilities.(map[int]Availability), nil
	}
}

func refresh() {
	// get the availabilitiesRaw from the database
	var availabilitiesRaw []availabilitiesDB

	if err := db.DB.Select(&availabilitiesRaw, "SELECT * FROM AVAILABILITIES"); err == nil {
		// convert the result in a map
		availabilities := map[int]Availability{}

		for _, a := range availabilitiesRaw {
			availabilities[a.Id] = Availability{
				Text:     a.Text,
				Disabled: a.Disabled,
			}
		}

		c.Set("availabilities", availabilities)
	}
}

func init() {
	c = cache.New(24 * time.Hour)

	c.OnExpired(refresh)

	refresh()
}
