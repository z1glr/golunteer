package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/tasks"
)

func getTasks(args HandlerArgs) responseMessage {
	response := responseMessage{}

	if tasks, err := tasks.Get(); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't get tasks: %v", err)
	} else {
		response.Data = tasks
	}

	return response
}
