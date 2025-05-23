package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/users"
)

func (a *Handler) getUsers() {
	if users, err := users.Get(); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't get users: %v", err)
	} else {
		a.Data = users
	}
}

func (a *Handler) getUserTasks() {
	if tasks, err := a.UserName.GetTasks(); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("getting possible user-tasks failed: %v", err)
	} else {
		a.Data = tasks
	}
}

func (a *Handler) postUser() {

	// check admin
	if !a.Admin {
		a.Status = fiber.StatusForbidden

		logger.Info().Msgf("user is no admin")
	} else {
		// parse the body
		var body users.UserAdd

		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("invalid body: %v", err)
		} else if err := users.Add(body); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Warn().Msgf("can't add user: %v", err)
		}
	}
}

func (a *Handler) putPassword() {
	// parse the body
	var body users.UserChangePassword

	if err := a.C.BodyParser(&body); err != nil {
		logger.Info().Msgf("can't parse body: %v", err)

		a.Status = fiber.StatusBadRequest

		// body has been parsed successfully
	} else {
		body.UserName = a.UserName

		// validate the body
		if err := validate.Struct(body); err != nil {
			logger.Info().Msgf("invalid body: %v", err)

			a.Status = fiber.StatusBadRequest

			// send the password change to the database and get the new tokenID back
		} else if tokenID, err := body.UserName.ChangePassword(body.Password); err != nil {
			logger.Error().Msgf("can't update password: %v", err)

			a.Status = fiber.StatusInternalServerError

			// sign a new JWT with the new tokenID
		} else if jwt, err := config.SignJWT(JWTPayload{
			UserName: body.UserName,
			TokenID:  tokenID,

			// if something failed, remove the current session-cookie
		}); err != nil {
			a.removeSessionCookie()

			a.Status = fiber.StatusPartialContent

			// set the new session-cookie
		} else {
			// update the token in the session-cookie
			a.setSessionCookie(&jwt)
		}
	}
}

func (a *Handler) patchUser() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusForbidden

		logger.Info().Msgf("user is no admin")
	} else {
		// parse the body
		var body struct {
			users.UserAdd
			NewName users.UserName `json:"newName"`
		}

		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Info().Msgf("can't parse body: %v", err)

			// prevent to demoting self from admin
		} else if !body.Admin && body.UserName == a.UserName {
			a.Status = fiber.StatusBadRequest

			logger.Warn().Msgf("can't demote self from admin")
		} else {
			// check for an empty user-name
			if len(body.UserName) == 0 {
				a.Status = fiber.StatusBadRequest

				logger.Warn().Msgf("username is empty")

				// if the password has length 0 assume the password shouldn't be changed
			} else {
				if len(body.Password) > 0 {
					if _, err = body.UserName.ChangePassword(body.Password); err != nil {
						a.Status = fiber.StatusInternalServerError

						logger.Error().Msgf("can't change password: %v", err)

						return
					}
				}

				// only change the name, if it differs
				if body.NewName != body.UserName {
					if err := body.UserName.ChangeName(body.NewName); err != nil {
						a.Status = fiber.StatusInternalServerError

						logger.Error().Msgf("can't change user-name: %v", err)

						return
					}
				}

				// set the admin-status
				if err := body.NewName.SetAdmin(body.Admin); err != nil {
					a.Status = fiber.StatusInternalServerError

					logger.Error().Msgf("updating admin-status failed: %v", err)

					// update the possible tasks
				} else if err := body.NewName.SetTasks(body.PossibleTasks); err != nil {
					a.Status = fiber.StatusInternalServerError

					logger.Error().Msgf("updating possible user-tasks failed: %v", err)

				} else {
					// if we modified ourself, update the session-cookie
					if body.UserName != body.NewName {
						// get the tokenID
						if tokenID, err := body.NewName.TokenID(); err != nil {
							a.Status = fiber.StatusInternalServerError

							logger.Error().Msgf("can't get tokenID: %v", err)

						} else if jwt, err := config.SignJWT(JWTPayload{
							UserName: body.NewName,
							TokenID:  tokenID,
						}); err != nil {
							a.Status = fiber.StatusInternalServerError

							logger.Error().Msgf("JWT-signing failed: %v", err)

							// remove the session-cookie
							a.removeSessionCookie()
						} else {
							a.setSessionCookie(&jwt)
						}
					}
				}
			}
		}
	}
}

func (a *Handler) deleteUser() {
	// check admin
	if !a.Admin {
		logger.Warn().Msg("user-deletion failed: user is no admin")

		a.Status = fiber.StatusUnauthorized

		// get the username from the query
	} else if userName := a.C.Query("userName"); userName == "" {
		logger.Info().Msg("user-deletion failed: query is missing \"userName\"")

		a.Status = fiber.StatusBadRequest

		// check wether the user tries to delete himself
	} else if users.UserName(userName) == a.UserName {
		logger.Info().Msg("user-deletion failed: self-deletion is illegal")

		a.Status = fiber.StatusBadRequest

		// check wether the user tries to delete the admin
	} else if userName == "admin" {
		logger.Info().Msg("user-deletion failed: admin-deletion is illegal")

		a.Status = fiber.StatusBadRequest

		// delete the user
	} else if err := users.Delete(userName); err != nil {
		logger.Error().Msgf("user-deletion failed: user doesn't exist")

		a.Status = fiber.StatusNotFound
	}
}
