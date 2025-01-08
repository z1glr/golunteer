package router

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type UserLogin struct {
	UserName string `json:"userName"`
	LoggedIn bool   `json:"loggedIn"`
}

// handle welcome-messages from clients
func handleWelcome(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	response := responseMessage{}
	response.Data = UserLogin{
		LoggedIn: false,
	}

	if ok, err := checkUser(c); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't check user: %v", err)
	} else if !ok {
		response.Status = fiber.StatusNoContent
	} else {
		if uid, _, err := extractJWT(c); err != nil {
			response.Status = fiber.StatusBadRequest

			logger.Error().Msgf("can't extract JWT: %v", err)
		} else {
			if users, err := db.SelectOld[UserDB]("users", "uid = ? LIMIT 1", strconv.Itoa(uid)); err != nil {
				response.Status = fiber.StatusInternalServerError

				logger.Error().Msgf("can't get users from database: %v", err)
			} else {
				if len(users) != 1 {
					response.Status = fiber.StatusForbidden
					response.Message = "unknown user"

					removeSessionCookie(c)
				} else {
					user := users[0]

					response.Data = UserLogin{
						UserName: user.UserName,
						LoggedIn: true,
					}
				}

				logger.Debug().Msgf("welcomed user with uid = %v", uid)
			}
		}
	}

	return response.send(c)
}

func handleLogin(c *fiber.Ctx) error {
	panic("not implemented yet")
}

// handles logout-requests
func handleLogout(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	removeSessionCookie(c)

	return responseMessage{
		Data: UserLogin{
			LoggedIn: false,
		},
	}.send(c)
}
