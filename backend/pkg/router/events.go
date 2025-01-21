package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
)

func postEvent(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden
	} else {

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
		}
	}

	return response
}

func patchEvent(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden
	} else {
		// parse the body
		var body events.EventPatch

		if err := args.C.BodyParser(&body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("ivnalid body: %v", err)

			// update the event
		} else if err := events.Update(body); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("updating the event failed: %v", err)
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

func getEventsAvailabilities(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check for admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden
	} else {
		if events, err := events.WithAvailabilities(); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't retrieve events with availabilities: %v", err)
		} else {
			response.Data = events
		}
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

func deleteEvent(args HandlerArgs) responseMessage {
	// check for admin
	if !args.User.Admin {

		logger.Warn().Msg("event-delete failed: user is no admin")

		return responseMessage{
			Status: fiber.StatusForbidden,
		}
		// -1 can't be valid
	} else if eventId := args.C.QueryInt("id", -1); eventId == -1 {
		logger.Log().Msgf("event-delete failed: \"id\" is missing in query")

		return responseMessage{
			Status: fiber.StatusBadRequest,
		}
	} else if err := events.Delete(eventId); err != nil {

		logger.Error().Msgf("event-delete failed: can't delete from database: %v", err)

		return responseMessage{
			Status: fiber.StatusInternalServerError,
		}
	} else {
		logger.Log().Msgf("deleted event with id %d", eventId)

		return responseMessage{}
	}
}
