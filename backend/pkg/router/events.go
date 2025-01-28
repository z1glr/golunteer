package router

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
	"github.com/johannesbuehl/golunteer/backend/pkg/db/events"
)

func (a *Handler) postEvent() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusForbidden
	} else {

		// write the event
		var body events.EventCreate

		// try to parse the body
		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// validate the parsed body
		} else if err := validate.Struct(body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("invalid body: %v", err)

			// create the event
		} else if err := events.Create(body); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't create event: %v", err)
		}
	}
}

func (a *Handler) patchEvent() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusForbidden
	} else {
		// parse the body
		var body events.EventPatch

		if err := a.C.BodyParser(&body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("can't parse body: %v", err)

			// validate the body
		} else if err := validate.Struct(body); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("ivnalid body: %v", err)

			// update the event
		} else if err := events.Update(body); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("updating the event failed: %v", err)
		}
	}
}

func (a *Handler) getEventsAssignments() {
	if events, err := events.WithAssignments(); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Error().Msgf("can't retrieve events with assignments: %v", err)
	} else {
		a.Data = events
	}
}

func (a *Handler) getEventsAvailabilities() {
	// check for admin
	if !a.Admin {
		a.Status = fiber.StatusForbidden
	} else {
		if events, err := events.WithAvailabilities(); err != nil {
			a.Status = fiber.StatusInternalServerError

			logger.Error().Msgf("can't retrieve events with availabilities: %v", err)
		} else {
			a.Data = events
		}
	}
}

func (a *Handler) getEventUserAssignmentAvailability() {
	// retrieve the assignments
	if events, err := events.WithUserAvailability(a.UserName); err != nil {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msgf("getting events with tasks and user-availability failed: %v", err)
	} else {
		a.Data = events
	}
}

func (a *Handler) getEventsUserPending() {
	if events, err := events.UserPending(a.UserName); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't query database for users %q pending events: %v", a.UserName, err)
	} else {
		a.Data = events
	}
}

func (a *Handler) getEventsUserPendingCount() {
	if count, err := events.UserPendingCount(a.UserName); err != nil {
		a.Status = fiber.StatusInternalServerError

		logger.Warn().Msgf("can't query database for users %q pending events: %v", a.UserName, err)
	} else {
		a.Data = count
	}
}

func (a *Handler) getEventsUserAssigned() {
	// retrieve the events from the database
	if events, err := events.User(a.UserName); err != nil {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msgf("retrieval of user-assigned-events failed: %v", err)
	} else {
		a.Data = events
	}
}

func (a *Handler) putEventUserAvailability() {
	// parse the query
	if eventID := a.C.QueryInt("eventID", -1); eventID == -1 {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msg("setting user-event-availability failed: query is missing \"eventID\"")
	} else {
		// parse the body
		body := a.C.Body()

		if availabilityID, err := strconv.Atoi(string(body)); err != nil {
			a.Status = fiber.StatusBadRequest

			logger.Log().Msgf("setting user-event-availability failed: can't get parse: %v", err)
		} else {
			// if there was already a task assigned for this user-event-combi, remove it
			var taskIDs []int
			if err := db.DB.Get(&taskIDs, "SELECT taskID FROM USER_ASSIGNMENTS WHERE eventID = $1 AND userName = $2", eventID, a.UserName); err != nil {
				a.Status = fiber.StatusInternalServerError

				logger.Error().Msgf("setting user-event availability failed: can't check for existing assignment: %v", err)
			} else if len(taskIDs) > 0 {
				if query, args, err := sqlx.In("UPDATE USER_ASSIGNMENTS SET userName = null WHERE eventID = $1 AND taskID = $2", eventID, taskIDs); err != nil {
					a.Status = fiber.StatusInternalServerError

					logger.Error().Msgf("setting user-event-availability failed: can't craft task-assignment-deletion-query: %v", err)
				} else {
					query = db.DB.Rebind(query)

					if _, err := db.DB.Exec(query, args); err != nil {
						a.Status = fiber.StatusInternalServerError

						logger.Error().Msgf("setting user-event-availability failed: can't delete task-assignments: %v", err)
					}
				}
			}

			// insert the availability into the database
			if err := events.SetUserAvailability(eventID, availabilityID, a.UserName); err != nil {
				a.Status = fiber.StatusInternalServerError

				logger.Error().Msgf("setting user-event-availability failed: can't write availability to database: %v", err)
			}
		}
	}
}

func (a *Handler) putEventAssignment() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("setting event-assignment failed: user is no admin")

		// retrieve the eventID from the query
	} else if eventID := a.C.QueryInt("eventID", -1); eventID == -1 {
		a.Status = fiber.StatusBadRequest

		logger.Warn().Msg("setting event-assignment failed: query is missing \"eventID\"")

		// retrieve the taskID from the query
	} else if taskID := a.C.QueryInt("taskID", -1); taskID == -1 {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msg("setting event-assignment failed: query is missing \"taskID\"")

		// parse the body
	} else if userName := string(a.C.Body()); userName == "" {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msg("setting event-assignment failed: body is missing")
		// check wether the user has actually entered an availability for the event
	} else if availabilityID, err := events.GetUserAvailability(eventID, userName); err != nil {
		a.Status = fiber.StatusBadRequest

		logger.Log().Msgf("setting event-assignment failed: can't check users availability: %v", err)
	} else if availabilityID == nil {
		a.Status = fiber.StatusConflict

		logger.Log().Msgf("setting event-assignment failed: user %q isn't available for event with eventID = %d", userName, eventID)

		// set the availability in the database
	} else if err := events.SetAssignment(eventID, taskID, userName); err != nil {
		a.Status = fiber.StatusBadRequest

		logger.Warn().Msgf("setting event-assignment failed: can't write to database: %v", err)
	}
}

func (a *Handler) deleteEventAssignment() {
	// check admin
	if !a.Admin {
		a.Status = fiber.StatusUnauthorized

		logger.Warn().Msg("deleting event-assignment failed: user is no admin")

		// retrieve the eventID from the query
	} else if eventID := a.C.QueryInt("eventID", -1); eventID == -1 {
		a.Status = fiber.StatusBadRequest

		logger.Warn().Msg("deleting event-assignment failed: query is missing \"eventID\"")

		// retrieve the taskID from the query
	} else if taskID := a.C.QueryInt("taskID", -1); taskID == -1 {
		a.Status = fiber.StatusBadRequest

		logger.Warn().Msg("deleting event-assignment failed: query is missing \"taskID\"")

		// set the availability in the database
	} else if err := events.DeleteAssignment(eventID, taskID); err != nil {
		a.Status = fiber.StatusBadRequest

		logger.Warn().Msgf("deleting event-assignment failed: can't write to database: %v", err)
	}

}

func (a *Handler) deleteEvent() {
	// check for admin
	if !a.Admin {

		logger.Warn().Msg("event-delete failed: user is no admin")

		a.Status = fiber.StatusForbidden
		// -1 can't be valid
	} else if eventId := a.C.QueryInt("eventID", -1); eventId == -1 {
		logger.Log().Msgf("event-delete failed: \"eventID\" is missing in query")

		a.Status = fiber.StatusBadRequest
	} else if err := events.Delete(eventId); err != nil {

		logger.Error().Msgf("event-delete failed: can't delete from database: %v", err)

		a.Status = fiber.StatusInternalServerError
	} else {
		logger.Log().Msgf("deleted event with eventID %d", eventId)
	}
}
