package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/users"
	"golang.org/x/crypto/bcrypt"
)

// handle welcome-messages from clients
func handleWelcome(c *fiber.Ctx) error {
	args := Handler{C: c}

	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	args.Data = UserChecked{
		Admin: false,
	}

	if loggedIn, err := args.checkUser(); err != nil {
		args.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't check user: %v", err)
	} else if !loggedIn {
		args.Status = fiber.StatusUnauthorized

		logger.Debug().Msgf("user not authorized")
	} else {
		args.Data = UserChecked{
			UserName: args.UserName,
			Admin:    args.Admin,
		}

		logger.Debug().Msgf("welcomed user %q", args.UserName)
	}

	return args.send(c)
}

const messageWrongLogin = "Unkown user or wrong password"

func handleLogin(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	args := Handler{C: c}

	// extract username and password from the request
	requestBody := struct {
		users.UserName `json:"userName" validate:"required"`
		Password       string `json:"password" validate:"required"`
	}{}

	if err := args.C.BodyParser(&requestBody); err != nil {
		logger.Debug().Msgf("can't parse login-body: %v", err)

		args.Status = fiber.StatusBadRequest

		// validate the body
	} else if err := validate.Struct(requestBody); err != nil {
		logger.Warn().Msgf("can't parse login-body: %v", err)
	} else {
		// query the database for the user
		var result userDB
		if err := db.DB.QueryRowx("SELECT password, admin, tokenID FROM USERS WHERE userName = ?", requestBody.UserName).StructScan(&result); err != nil {
			args.Status = fiber.StatusForbidden
			args.Message = messageWrongLogin

			logger.Info().Msgf("can't get user with userName = %q from database", requestBody.UserName)
		} else {
			// hash the password
			if bcrypt.CompareHashAndPassword(result.Password, []byte(requestBody.Password)) != nil {
				args.Status = fiber.StatusForbidden

				logger.Info().Msgf("login denied: wrong password for user with userName = %q", requestBody.UserName)
			} else {
				// password is correct -> generate the JWT
				if jwt, err := config.SignJWT(JWTPayload{
					UserName: requestBody.UserName,
					TokenID:  result.TokenID,
				}); err != nil {
					args.Status = fiber.StatusInternalServerError
					logger.Error().Msgf("can't create JWT: %v", err)
				} else {
					args.setSessionCookie(&jwt)

					args.Data = UserChecked{
						UserName: requestBody.UserName,
						Admin:    true,
					}

					logger.Debug().Msgf("user %q logged in", requestBody.UserName)
				}
			}
		}
	}

	return args.send(args.C)
}

// handles logout-requests
func handleLogout(c *fiber.Ctx) error {
	logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

	args := Handler{
		C: c,
	}

	args.removeSessionCookie()

	return args.send(c)
}
