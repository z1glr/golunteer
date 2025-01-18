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
		response.Data = struct {
			Availabilities []availabilities.AvailabilityDB `json:"availabilities"`
		}{Availabilities: avails}

		return response
	}
}

func postAvailabilitie(args HandlerArgs) responseMessage {
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

func patchAvailabilities(args HandlerArgs) responseMessage {
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
