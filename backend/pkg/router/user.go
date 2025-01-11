package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/users"
)

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
			removeSessionCookie(args.C)

			// set the new session-cookie
		} else {
			// update the token in the session-cookie
			setSessionCookie(args.C, &jwt)
		}
	}

	return response
}
