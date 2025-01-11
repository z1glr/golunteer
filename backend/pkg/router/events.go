package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
)

func postEvent(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// write the event
	var body events.EventCreate

	// try to parse the body
	if err := args.C.BodyParser(&body); err != nil {
		response.Status = fiber.StatusBadRequest

		logger.Log().Msgf("can't parse body: %v", err)

		// validate the parsed body
	} else if err := validate.Struct(body); err != nil {
		response.Status = fiber.StatusBadRequest

		logger.Log().Msgf("invalid body: %v", err)

		// create the event
	} else if err := events.Create(body); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't create event: %v", err)
	} else {
		// respond with the new events
		if events, err := events.WithAssignments(); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't retrieve events: %v", err)
		} else {
			response.Data = events
		}
	}

	return response
}

func getEventsAssignments(args HandlerArgs) responseMessage {
	response := responseMessage{}

	if events, err := events.WithAssignments(); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't retrieve events with assignments: %v", err)
	} else {
		response.Data = events
	}

	return response
}

func getEventsUserPending(args HandlerArgs) responseMessage {
	response := responseMessage{}

	if count, err := events.UserPending(args.User.UserName); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't query database for users %q pending events: %v", args.User.UserName, err)
	} else {
		response.Data = count
	}

	return response
}
