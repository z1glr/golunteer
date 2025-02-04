package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/tasks"
)

func (a *Handler) getTasks() {
	if taskSlice, err := tasks.GetSlice(); err != nil {
		logger.Error().Msgf("can't get tasks: %v", err)

		a.Status = fiber.StatusInternalServerError
	} else {
		a.Data = taskSlice
	}
}

func (a *Handler) postTask() {
	// check admin
	if !a.Admin {
		logger.Info().Msgf("user is not admin")

		a.Status = fiber.StatusUnauthorized
	} else {
		// parse the body
		var task tasks.Task

		if err := a.C.BodyParser(&task); err != nil {
			logger.Info().Msgf("can't parse body: %v", err)

			a.Status = fiber.StatusBadRequest

			// validate the body
		} else if err := validate.Struct(&task); err != nil {
			logger.Info().Msgf("invalid body: %v", err)

			a.Status = fiber.StatusBadRequest

			// insert the task into the database
		} else if err := tasks.Add(task); err != nil {
			logger.Error().Msgf("can't add task: %v", err)

			a.Status = fiber.StatusInternalServerError
		}
	}
}

func (a *Handler) patchTask() {
	// check admin
	if !a.Admin {
		logger.Info().Msgf("user is not admin")

		a.Status = fiber.StatusUnauthorized
	} else {
		// parse the body
		var task tasks.TaskDB

		if err := a.C.BodyParser(&task); err != nil {
			logger.Info().Msgf("can't parse body: %v", err)

			a.Status = fiber.StatusBadRequest

			// validate the body
		} else if err := validate.Struct(&task); err != nil {
			logger.Info().Msgf("invalid body: %v", err)

			a.Status = fiber.StatusBadRequest

			// insert the task into the database
		} else if err := tasks.Update(task); err != nil {
			logger.Error().Msgf("can't update task: %v", err)

			a.Status = fiber.StatusInternalServerError
		}
	}
}

func (a *Handler) deleteTask() {
	// check admin
	if !a.Admin {
		logger.Warn().Msg("task-deletion failed: user is no admin")

		a.Status = fiber.StatusUnauthorized

		// parse the query
	} else if taskID := a.C.QueryInt("taskID", -1); taskID == -1 {
		logger.Info().Msg("task-deletion failed: invalid query: doesn't include \"taskID\"")

		a.Status = fiber.StatusBadRequest

		// delete the task from the database
	} else if err := tasks.Delete(taskID); err != nil {
		logger.Error().Msgf("task-deletion failed: can't delete task from database: %v", err)

		a.Status = fiber.StatusInternalServerError
	}
}
