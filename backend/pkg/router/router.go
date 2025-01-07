package router

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	_logger "github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

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

func init() {
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
		"DELETE": app.Delete,
	}

	// map with the individual registered endpoints
	endpoints := map[string]map[string]func(*fiber.Ctx) responseMessage{
		"GET":    {"events": getEvents},
		"POST":   {},
		"PATCH":  {},
		"DELETE": {},
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

				return handler(c).send(c)
			})
		}
	}
}

func Listen() {
	// start the server
	err := app.Listen(fmt.Sprintf(":%d", config.Server.Port))

	fmt.Println(err)
}

func setSessionCookie(c *fiber.Ctx, jwt *string) {
	var value string

	if jwt == nil {
		value = c.Cookies("session")
	} else {
		value = *jwt
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    value,
		HTTPOnly: true,
		SameSite: "strict",
		MaxAge:   int(config.SessionExpire.Seconds()),
	})
}

// removes the session-coockie from a request
func removeSessionCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",
		HTTPOnly: true,
		SameSite: "strict",
		Expires:  time.Unix(0, 0),
	})
}

// payload of the JSON webtoken
type JWTPayload struct {
	UserID  int    `json:"userID"`
	TokenID string `json:"tokenID"`
}

// complete JSON webtoken
type JWT struct {
	_config.Payload
	CustomClaims JWTPayload
}

// extracts the json webtoken from the request
//
// @returns (userID, tokenID, error)
func extractJWT(c *fiber.Ctx) (int, string, error) {
	// get the session-cookie
	cookie := c.Cookies("session")

	token, err := jwt.ParseWithClaims(cookie, &JWT{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected JWT signing method: %v", token.Header["alg"])
		}

		return []byte(config.ClientSession.JwtSignature), nil
	})

	if err != nil {
		return -1, "", err
	}

	// extract the claims from the JWT
	if claims, ok := token.Claims.(*JWT); ok && token.Valid {
		return claims.CustomClaims.UserID, claims.CustomClaims.TokenID, nil
	} else {
		return -1, "", fmt.Errorf("invalid JWT")
	}
}

// user-entry in the database
type UserDB struct {
	UserID   int    `json:"userID"`
	Name     string `json:"name"`
	Password []byte `json:"password"`
	Admin    bool   `json:"admin"`
	TokenID  string `json:"tokenID"`
}

// checks wether the request is from a valid user
func checkUser(c *fiber.Ctx) (bool, error) {
	uid, tid, err := extractJWT(c)

	if err != nil {
		return false, nil
	}

	// retrieve the user from the database
	response, err := db.SelectOld[UserDB]("users", "uid = ? LIMIT 1", uid)

	if err != nil {
		return false, err
	}

	// if exactly one user came back and the tID is valid, the user is authorized
	if len(response) == 1 && response[0].TokenID == tid {
		// reset the expiration of the cookie
		setSessionCookie(c, nil)

		return true, err
	} else {
		return false, err
	}
}

// checks wether the request is from the admin
func checkAdmin(c *fiber.Ctx) (bool, error) {
	uid, tokenID, err := extractJWT(c)

	if err != nil {
		return false, err
	}

	// retrieve the user from the database
	response, err := db.SelectOld[UserDB]("users", "uid = ? LIMIT 1", uid)

	if err != nil {
		return false, err
	}

	// if exactly one user came back and its name is "admin", the user is the admin
	if len(response) != 1 {
		return false, fmt.Errorf("user doesn't exist")
	} else {
		return response[0].Name == "admin" && response[0].TokenID == tokenID, err
	}
}
