package router

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	_logger "github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

var validate *validator.Validate

var logger = _logger.Logger
var config = _config.Config

var app *fiber.App

// general message for REST-responses
type responseMessage struct {
	Status  int
	Message string
	Data    any
}

// answer the client request with the response-message
func (result responseMessage) send(c *fiber.Ctx) error {
	// if the status-code is in the error-region, return an error
	if result.Status >= 400 {
		// if available, include the message
		if result.Message != "" {
			return fiber.NewError(result.Status, result.Message)
		} else {
			return fiber.NewError(result.Status)
		}
	} else {
		// if there is data, send it as JSON
		if result.Data != nil {
			c.JSON(result.Data)

			// if there is a message, send it instead
		} else if result.Message != "" {
			c.SendString(result.Message)
		}

		return c.SendStatus(result.Status)
	}
}

type HandlerArgs struct {
	C    *fiber.Ctx
	User UserChecked
}

func init() {
	validate = validator.New()

	// setup fiber
	app = fiber.New(fiber.Config{
		AppName:               "johannes-pv",
		DisableStartupMessage: true,
	})

	// map with the individual methods
	handleMethods := map[string]func(path string, handlers ...func(*fiber.Ctx) error) fiber.Router{
		"GET":    app.Get,
		"POST":   app.Post,
		"PATCH":  app.Patch,
		"PUT":    app.Put,
		"DELETE": app.Delete,
	}

	// map with the individual registered endpoints
	endpoints := map[string]map[string]func(HandlerArgs) responseMessage{
		"GET": {
			"events/assignments":    getEventsAssignments,
			"events/availabilities": getEventsAvailabilities,
			"events/user/pending":   getEventsUserPending,
			"tasks":                 getTasks,
			"users":                 getUsers,
			"availabilities":        getAvailabilities,
		},
		"POST": {
			"events":         postEvent,
			"users":          postUser,
			"availabilities": postAvailabilitie,
		},
		"PATCH": {
			"users":          patchUser,
			"events":         patchEvent,
			"availabilities": patchAvailabilities,
		},
		"PUT": {
			"users/password": putPassword,
		},
		"DELETE": {
			"event": deleteEvent,
		},
	}

	// handle specific requests special
	app.Get("/api/welcome", handleWelcome)
	app.Post("/api/login", handleLogin)
	app.Get("/api/logout", handleLogout)

	// register the registered endpoints
	for method, handlers := range endpoints {
		for address, handler := range handlers {
			handleMethods[method]("/api/"+address, func(c *fiber.Ctx) error {
				logger.Debug().Msgf("HTTP %s request: %q", c.Method(), c.OriginalURL())

				var response responseMessage
				args := HandlerArgs{
					C: c,
				}

				if loggedIn, err := args.checkUser(); err != nil {
					response = responseMessage{
						Status: fiber.StatusBadRequest,
					}

					logger.Error().Msgf("can't check user: %v", err)
				} else if !loggedIn {
					response = responseMessage{
						Status: fiber.StatusUnauthorized,
					}

					logger.Log().Msgf("user not authorized")
				} else {
					response = handler(args)
				}

				return response.send(c)
			})
		}
	}
}

func Listen() {
	// start the server
	err := app.Listen(fmt.Sprintf(":%d", config.Server.Port))

	fmt.Println(err)
}

func (args HandlerArgs) setSessionCookie(jwt *string) {
	var value string

	if jwt == nil {
		value = args.C.Cookies("session")
	} else {
		value = *jwt
	}

	args.C.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    value,
		HTTPOnly: true,
		SameSite: "strict",
		MaxAge:   int(config.SessionExpire.Seconds()),
	})
}

// removes the session-coockie from a request
func (args HandlerArgs) removeSessionCookie() {
	args.C.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",
		HTTPOnly: true,
		SameSite: "strict",
		Expires:  time.Unix(0, 0),
	})
}

// payload of the JSON webtoken
type JWTPayload struct {
	UserName string `json:"userName"`
	TokenID  string `json:"tokenID"`
}

// complete JSON webtoken
type JWT struct {
	_config.Payload
	CustomClaims JWTPayload
}

// extracts the json webtoken from the request
//
// @returns (userName, tokenID, error)
func extractJWT(c *fiber.Ctx) (string, string, error) {
	// get the session-cookie
	cookie := c.Cookies("session")

	token, err := jwt.ParseWithClaims(cookie, &JWT{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected JWT signing method: %v", token.Header["alg"])
		}

		return []byte(config.ClientSession.JwtSignature), nil
	})

	if err != nil {
		return "", "", err
	}

	// extract the claims from the JWT
	if claims, ok := token.Claims.(*JWT); ok && token.Valid {
		return claims.CustomClaims.UserName, claims.CustomClaims.TokenID, nil
	} else {
		return "", "", fmt.Errorf("invalid JWT")
	}
}

// user-entry in the database
type userDB struct {
	UserName string `db:"userName"`
	Password []byte `db:"password"`
	Admin    bool   `db:"admin"`
	TokenID  string `db:"tokenID"`
}

type UserChecked struct {
	UserName string `json:"userName" db:"userName"`
	Admin    bool   `json:"admin" db:"admin"`
}

// checks wether the request is from a valid user
func (args *HandlerArgs) checkUser() (bool, error) {
	userName, tokenID, err := extractJWT(args.C)

	if err != nil {
		return false, nil
	}

	var dbResult struct {
		TokenID string `db:"tokenID"`
		Admin   bool   `db:"admin"`
	}

	// retrieve the user from the database
	if err := db.DB.Get(&dbResult, "SELECT tokenID, admin FROM USERS WHERE name = ?", userName); err != nil {
		return false, err

		// if the tokenID is valid, the user is authorized
	} else if dbResult.TokenID != tokenID {
		return false, nil
	} else {
		// reset the expiration of the cookie
		args.setSessionCookie(nil)

		args.User = UserChecked{
			UserName: userName,
			Admin:    dbResult.Admin,
		}
		return true, nil

	}
}
