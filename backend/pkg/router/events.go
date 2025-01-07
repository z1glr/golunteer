package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
)

func getEvents(c *fiber.Ctx) responseMessage {
	response := responseMessage{}

	// get all eventRows
	if eventRows, err := events.All(); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("events retrieving failed: %v", err)
	} else {
		// get the data for all the allEvents
		allEvents := []events.Event{}

		for _, eventRow := range eventRows {
			if e, err := eventRow.Event(); err != nil {
				logger.Error().Msgf("error while populating event with id = %d: %v", eventRow.Id, err)
			} else {
				allEvents = append(allEvents, e)
			}

			// response.Data = struct{ Events []events.Event }{Events: allEvents}
			response.Data = allEvents
		}
	}

	return response
}
