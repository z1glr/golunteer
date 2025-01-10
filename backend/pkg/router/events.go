package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
)

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
