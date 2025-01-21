package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
)

func getAvailabilities(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// get all the availabilites from the database
	if avails, err := availabilities.Slice(); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't get availabilites: %v", err)

		return response
	} else {
		response.Data = avails

		return response
	}
}

func postAvailability(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("user is no admin")

		return response

		// parse the body
	} else {
		var body availabilities.Availability

		if err := args.C.BodyParser(&body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			return response

			// validate the body
		} else if err := validate.Struct(&response); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("invalid body: %v", err)

			return response
		} else if err := availabilities.Add(body); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't add availability: %v", err)

			return response
		} else {
			return response
		}
	}
}

func patchAvailabilitiy(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("user is no admin")

		return response

		// parse the body
	} else {
		var body availabilities.AvailabilityDB

		if err := args.C.BodyParser(&body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			return response

			// validate the body
		} else if err := validate.Struct(&response); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("invalid body: %v", err)

			return response
		} else if err := availabilities.Update(body); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't update availability: %v", err)

			return response
		} else {
			return response
		}
	}
}

func deleteAvailability(args HandlerArgs) responseMessage {
	// check admin
	if !args.User.Admin {
		logger.Warn().Msg("availability-deletion failed: user is no admin")

		return responseMessage{
			Status: fiber.StatusUnauthorized,
		}

		// parse the query
	} else if taskID := args.C.QueryInt("id", -1); taskID == -1 {
		logger.Log().Msg("availability-deletion failed: invalid query: doesn't include \"id\"")

		return responseMessage{
			Status: fiber.StatusBadRequest,
		}

		// delete the task from the database
	} else if err := availabilities.Delete(taskID); err != nil {
		logger.Error().Msgf("availability-deletion failed: can't delete task from database: %v", err)

		return responseMessage{
			Status: fiber.StatusInternalServerError,
		}
	} else {
		return responseMessage{}
	}
}
