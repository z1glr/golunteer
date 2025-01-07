package availabilites

import (
	"fmt"
	"time"

	cache "github.com/jfarleyx/go-simple-cache"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type availabilitesDB struct {
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
	if availabilities, hit := c.Get("availabilites"); !hit {
		refresh()

		return nil, fmt.Errorf("availabilites not stored cached")
	} else {
		return availabilities.(map[int]Availability), nil
	}
}

func refresh() {
	// get the availabilitesRaw from the database
	var availabilitesRaw []availabilitesDB

	if err := db.DB.Select(&availabilitesRaw, "SELECT * FROM AVAILABILITIES"); err == nil {
		// convert the result in a map
		availabilites := map[int]Availability{}

		for _, a := range availabilitesRaw {
			availabilites[a.Id] = Availability{
				Text:     a.Text,
				Disabled: a.Disabled,
			}
		}

		c.Set("availabilites", availabilites)
	}
}

func init() {
	c = cache.New(24 * time.Hour)

	c.OnExpired(refresh)

	refresh()
}
