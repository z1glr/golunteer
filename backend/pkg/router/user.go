package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/users"
)

func getUsers(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden

		logger.Log().Msgf("user is no admin")
	} else if users, err := users.Get(); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't get users: %v", err)
	} else {
		response.Data = users
	}

	return response
}

func postUser(args HandlerArgs) responseMessage {
	response := responseMessage{}

	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden
	} else {
		// parse the body
		var body users.UserAdd

		if err := args.C.BodyParser(&body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("invalid body: %v", err)
		} else if err := users.Add(body); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Warn().Msgf("can't add user: %v", err)
		}
	}

	return response
}

func patchPassword(args HandlerArgs) responseMessage {
	response := responseMessage{}
	// parse the body
	var body users.UserChangePassword

	if err := args.C.BodyParser(&body); err != nil {
		response.Status = fiber.StatusBadRequest

		logger.Log().Msgf("can't parse body: %v", err)
	} else {
		body.UserName = args.User.UserName

		if err := validate.Struct(body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Info().Msgf("invalid body: %v", err)
		} else if tokenID, err := users.ChangePassword(body); err != nil {
			response.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't update password: %v", err)

			// sign a new JWT with the new tokenID
		} else if jwt, err := config.SignJWT(JWTPayload{
			UserName: body.UserName,
			TokenID:  tokenID,

			// if something failed, remove the current session-cookie
		}); err != nil {
			args.removeSessionCookie()

			// set the new session-cookie
		} else {
			// update the token in the session-cookie
			args.setSessionCookie(&jwt)
		}
	}

	return response
}

func patchUser(args HandlerArgs) responseMessage {
	response := responseMessage{}
	// check admin
	if !args.User.Admin {
		response.Status = fiber.StatusForbidden

		logger.Log().Msgf("user is no admin")
	} else {
		// parse the body
		var body struct {
			users.UserAdd
			NewName string `json:"newName"`
		}

		if err := args.C.BodyParser(&body); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// prevent to demoting self from admin
		} else if !body.Admin && body.UserName == args.User.UserName {
			response.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("can't demote self from admin")
		} else {
			// check for an empty user-name
			if len(body.UserName) == 0 {
				response.Status = fiber.StatusBadRequest

				logger.Warn().Msgf("username is empty")

				// if the password has length 0 assume the password shouldn't be changed
			} else {
				if len(body.Password) > 0 {
					// create a password-change-struct and validate it. use the old user-name, since the new isn't stored yet
					usePasswordChange := users.UserChangePassword{
						UserName: body.UserName,
						Password: body.Password,
					}

					if _, err = users.ChangePassword(usePasswordChange); err != nil {
						response.Status = fiber.StatusInternalServerError

						logger.Error().Msgf("can't change password: %v", err)

						return response
					}
				}

				// only change the name, if it differs
				if body.NewName != body.UserName {
					if err := users.ChangeName(body.UserName, body.NewName); err != nil {
						response.Status = fiber.StatusInternalServerError

						logger.Error().Msgf("can't change user-name: %v", err)

						return response
					}
				}

				// set the admin-status
				if err := users.SetAdmin(body.NewName, body.Admin); err != nil {
					response.Status = fiber.StatusInternalServerError

					logger.Error().Msgf("updating admin-status failed: %v", err)
				} else {
					// if we modified ourself, update the session-cookie
					if body.UserName == args.User.UserName {
						// get the tokenID
						if tokenID, err := users.TokenID(body.NewName); err != nil {
							response.Status = fiber.StatusInternalServerError

							logger.Error().Msgf("can't get tokenID: %v", err)

						} else if jwt, err := config.SignJWT(JWTPayload{
							UserName: body.NewName,
							TokenID:  tokenID,
						}); err != nil {
							response.Status = fiber.StatusInternalServerError

							logger.Error().Msgf("JWT-signing failed: %v", err)

							// remove the session-cookie
							args.removeSessionCookie()
						} else {
							args.setSessionCookie(&jwt)
						}
					}
				}
			}
		}
	}

	return response
}
