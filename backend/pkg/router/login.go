package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

// handle welcome-messages from clients
func handleWelcome(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	response := responseMessage{}
	response.Data = UserChecked{
		Admin: false,
	}

	if user, err := checkUser(c); err != nil {
		response.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't check user: %v", err)
	} else if user == nil {
		response.Status = fiber.StatusNoContent

		logger.Debug().Msgf("user not authorized")
	} else {
		response.Data = UserChecked{
			UserName: user.UserName,
			Admin:    user.Admin,
		}

		logger.Debug().Msgf("welcomed user %q", user.UserName)
	}

	return response.send(c)
}

const messageWrongLogin = "Unkown user or wrong password"

func handleLogin(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	// extract username and password from the request
	requestBody := struct {
		Username string `json:"userName" validate:"required"`
		Password string `json:"password" validate:"required"`
	}{}

	var response responseMessage

	if err := c.BodyParser(&requestBody); err != nil {
		logger.Debug().Msgf("can't parse login-body: %v", err)

		response.Status = fiber.StatusBadRequest

		// validate the body
	} else if err := validate.Struct(requestBody); err != nil {
		logger.Warn().Msgf("can't parse login-body: %v", err)
	} else {
		// query the database for the user
		var result userDB
		if err := db.DB.QueryRowx("SELECT password, admin, tokenID FROM USERS WHERE name = ?", requestBody.Username).StructScan(&result); err != nil {
			response.Status = fiber.StatusForbidden
			response.Message = messageWrongLogin

			logger.Info().Msgf("can't get user with name = %q from database", requestBody.Username)
		} else {
			// hash the password
			if bcrypt.CompareHashAndPassword(result.Password, []byte(requestBody.Password)) != nil {
				response.Status = fiber.StatusForbidden

				logger.Info().Msgf("login denied: wrong password for user with name = %q", requestBody.Username)
			} else {
				// password is correct -> generate the JWT
				if jwt, err := config.SignJWT(JWTPayload{
					UserName: requestBody.Username,
					TokenID:  result.TokenID,
				}); err != nil {
					response.Status = fiber.StatusInternalServerError
					logger.Error().Msgf("can't create JWT: %v", err)
				} else {
					setSessionCookie(c, &jwt)

					response.Data = UserChecked{
						UserName: requestBody.Username,
						Admin:    true,
					}

					logger.Debug().Msgf("user %q logged in", requestBody.Username)
				}
			}
		}
	}

	return response.send(c)
}

// handles logout-requests
func handleLogout(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	removeSessionCookie(c)

	return responseMessage{}.send(c)
}
