package assignments

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type assignments map[string]*string

type eventAssignmentDB struct {
	TaskName string  `db:"taskName"`
	UserName *string `db:"userName"`
}

func Event(eventID int) (assignments, error) {
	// get the assignments from the database
	var assignmentRows []eventAssignmentDB

	if err := db.DB.Select(&assignmentRows, "SELECT USERS.name AS userName, TASKS.text AS taskName FROM USER_ASSIGNMENTS LEFT JOIN USERS ON USER_ASSIGNMENTS.userName = USERS.name LEFT JOIN TASKS ON USER_ASSIGNMENTS.taskID = TASKS.id WHERE USER_ASSIGNMENTS.eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		// transform the rows into the returned map
		eventAssignments := assignments{}

		for _, assignment := range assignmentRows {
			eventAssignments[assignment.TaskName] = assignment.UserName
		}

		return eventAssignments, nil
	}
}
