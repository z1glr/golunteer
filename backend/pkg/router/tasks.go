package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/tasks"
)

func getTasks(args HandlerArgs) responseMessage {
	if taskSlice, err := tasks.GetSlice(); err != nil {
		logger.Error().Msgf("can't get tasks: %v", err)

		return responseMessage{
			Status: fiber.StatusInternalServerError,
		}
	} else {
		return responseMessage{
			Data: taskSlice,
		}
	}
}

func postTask(args HandlerArgs) responseMessage {
	// check admin
	if !args.User.Admin {
		logger.Log().Msgf("user is not admin")

		return responseMessage{
			Status: fiber.StatusUnauthorized,
		}
	} else {
		// parse the body
		var task tasks.Task

		if err := args.C.BodyParser(&task); err != nil {
			logger.Log().Msgf("can't parse body: %v", err)

			return responseMessage{
				Status: fiber.StatusBadRequest,
			}

			// validate the body
		} else if err := validate.Struct(&task); err != nil {
			logger.Log().Msgf("invalid body: %v", err)

			return responseMessage{
				Status: fiber.StatusBadRequest,
			}

			// insert the task into the database
		} else if err := tasks.Add(task); err != nil {
			logger.Error().Msgf("can't add task: %v", err)

			return responseMessage{
				Status: fiber.StatusInternalServerError,
			}
		} else {
			return responseMessage{}
		}
	}
}

func patchTask(args HandlerArgs) responseMessage {
	// check admin
	if !args.User.Admin {
		logger.Log().Msgf("user is not admin")

		return responseMessage{
			Status: fiber.StatusUnauthorized,
		}
	} else {
		// parse the body
		var task tasks.TaskDB

		if err := args.C.BodyParser(&task); err != nil {
			logger.Log().Msgf("can't parse body: %v", err)

			return responseMessage{
				Status: fiber.StatusBadRequest,
			}

			// validate the body
		} else if err := validate.Struct(&task); err != nil {
			logger.Log().Msgf("invalid body: %v", err)

			return responseMessage{
				Status: fiber.StatusBadRequest,
			}

			// insert the task into the database
		} else if err := tasks.Update(task); err != nil {
			logger.Error().Msgf("can't update task: %v", err)

			return responseMessage{
				Status: fiber.StatusInternalServerError,
			}
		} else {
			return responseMessage{}
		}
	}
}

func deleteTask(args HandlerArgs) responseMessage {
	// check admin
	if !args.User.Admin {
		logger.Warn().Msg("task-deletion failed: user is no admin")

		return responseMessage{
			Status: fiber.StatusUnauthorized,
		}

		// parse the query
	} else if taskID := args.C.QueryInt("id", -1); taskID == -1 {
		logger.Log().Msg("task-deletion failed: invalid query: doesn't include \"id\"")

		return responseMessage{
			Status: fiber.StatusBadRequest,
		}

		// delete the task from the database
	} else if err := tasks.Delete(taskID); err != nil {
		logger.Error().Msgf("task-deletion failed: can't delete task from database: %v", err)

		return responseMessage{
			Status: fiber.StatusInternalServerError,
		}
	} else {
		return responseMessage{}
	}
}
