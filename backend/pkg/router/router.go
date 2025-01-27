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
func (a *Handler) send(c *fiber.Ctx) error {
	// if the status-code is in the error-region, return an error
	if a.Status >= 400 {
		// if available, include the message
		if a.Message != "" {
			return fiber.NewError(a.Status, a.Message)
		} else {
			return fiber.NewError(a.Status)
		}
	} else {
		// if there is data, send it as JSON
		if a.Data != nil {
			c.JSON(a.Data)

			// if there is a message, send it instead
		} else if a.Message != "" {
			c.SendString(a.Message)
		}

		return c.SendStatus(a.Status)
	}
}

type Handler struct {
	C *fiber.Ctx
	UserChecked
	responseMessage
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
	endpoints := map[string]map[string]func(*Handler){
		"GET": {
			// all events with the task-assignments
			"events/assignments": (*Handler).getEventsAssignments,

			// all events with the availabilities of the individual users
			"events/availabilities": (*Handler).getEventsAvailabilities,

			// all events with the task-assignments and the availability of the current user
			"events/user/assignmentAvailability": (*Handler).getEventUserAssignmentAvailability,

			// events the user has to enter his availability for
			"events/user/pending": (*Handler).getEventsUserPending,

			// number of events the user has to enter his availability for
			"events/user/pending/count": (*Handler).getEventsUserPendingCount,

			"events/user/assigned": (*Handler).getEventsUserAssigned,
			"tasks":                (*Handler).getTasks,          // all available tasks
			"users":                (*Handler).getUsers,          // all users
			"availabilities":       (*Handler).getAvailabilities, // all available availabilities
		},
		"POST": {
			"events":         (*Handler).postEvent,        // create an event
			"users":          (*Handler).postUser,         // add an user
			"availabilities": (*Handler).postAvailability, // add an availability
			"tasks":          (*Handler).postTask,         // add a task
		},
		"PATCH": {
			"users":          (*Handler).patchUser,          // modify an user
			"events":         (*Handler).patchEvent,         // modify an event
			"availabilities": (*Handler).patchAvailabilitiy, // modify an availability
			"tasks":          (*Handler).patchTask,          // modify a task
		},
		"PUT": {
			"events/user/availability": (*Handler).putEventUserAvailability, // set or change the users availability for a specific event
			"events/assignments":       (*Handler).putEventAssignment,
			"users/password":           (*Handler).putPassword, // change the password
		},
		"DELETE": {
			"event":              (*Handler).deleteEvent, // remove an event
			"events/assignments": (*Handler).deleteEventAssignment,
			"tasks":              (*Handler).deleteTask,         // remove a task
			"availabilities":     (*Handler).deleteAvailability, // remove an availability
			"users":              (*Handler).deleteUser,         // remove an user
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

				args := Handler{
					C: c,
				}

				if loggedIn, err := args.checkUser(); err != nil {
					args.Status = fiber.StatusBadRequest

					logger.Error().Msgf("can't check user: %v", err)
				} else if !loggedIn {
					args.Status = fiber.StatusUnauthorized

					logger.Log().Msgf("user not authorized")
				} else {
					handler(&args)
				}

				return args.send(c)
			})
		}
	}
}

func Listen() {
	// start the server
	err := app.Listen(fmt.Sprintf(":%d", config.Server.Port))

	fmt.Println(err)
}

func (args Handler) setSessionCookie(jwt *string) {
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
func (args Handler) removeSessionCookie() {
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
func (args *Handler) checkUser() (bool, error) {
	userName, tokenID, err := extractJWT(args.C)

	if err != nil {
		return false, nil
	}

	var dbResult struct {
		TokenID string `db:"tokenID"`
		Admin   bool   `db:"admin"`
	}

	// retrieve the user from the database
	if err := db.DB.Get(&dbResult, "SELECT tokenID, admin FROM USERS WHERE userName = ?", userName); err != nil {
		return false, err

		// if the tokenID is valid, the user is authorized
	} else if dbResult.TokenID != tokenID {
		return false, nil
	} else {
		// reset the expiration of the cookie
		args.setSessionCookie(nil)

		args.UserName = userName
		args.Admin = dbResult.Admin
	}
	return true, nil

}
