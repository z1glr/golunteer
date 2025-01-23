package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/availabilities"
)

func (a *Handler) getAvailabilities() {
	// get all the availabilites from the database
	if avails, err := availabilities.Slice(); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't get availabilites: %v", err)
	} else {
		a.Data = avails
	}
}

func (a *Handler) postAvailability() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("user is no admin")

		// parse the body
	} else {
		var body availabilities.Availability

		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("invalid body: %v", err)

		} else if err := availabilities.Add(body); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't add availability: %v", err)
		}
	}
}

func (a *Handler) patchAvailabilitiy() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("user is no admin")

		// parse the body
	} else {
		var body availabilities.AvailabilityDB

		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("invalid body: %v", err)
		} else if err := availabilities.Update(body); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't update availability: %v", err)
		}
	}
}

func (a *Handler) deleteAvailability() {
	// check admin
	if !a.Admin {
		logger.Warn().Msg("availability-deletion failed: user is no admin")

		a.Status = fiber.StatusUnauthorized

		// parse the query
	} else if taskID := a.C.QueryInt("availabilityID", -1); taskID == -1 {
		logger.Log().Msg("availability-deletion failed: invalid query: doesn't include \"availabilityID\"")

		a.Status = fiber.StatusBadRequest

		// delete the task from the database
	} else if err := availabilities.Delete(taskID); err != nil {
		logger.Error().Msgf("availability-deletion failed: can't delete task from database: %v", err)

		a.Status = fiber.StatusInternalServerError
	}
}
