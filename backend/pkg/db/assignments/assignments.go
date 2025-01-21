package assignments

import (
	"github.com/johannesbuehl/golunteer/backend/pkg/db"
)

type EventAssignment struct {
	TaskID   int     `db:"taskID" json:"taskID"`
	TaskName string  `db:"taskName" json:"taskName"`
	UserName *string `db:"userName" json:"userName"`
}

func Event(eventID int) ([]EventAssignment, error) {
	// get the assignments from the database
	var assignmentRows []EventAssignment

	if err := db.DB.Select(&assignmentRows, "SELECT USERS.name AS userName, taskID, TASKS.name AS taskName FROM USER_ASSIGNMENTS LEFT JOIN USERS ON USER_ASSIGNMENTS.userName = USERS.name LEFT JOIN TASKS ON USER_ASSIGNMENTS.taskID = TASKS.id WHERE USER_ASSIGNMENTS.eventID = ?", eventID); err != nil {
		return nil, err
	} else {
		return assignmentRows, nil
	}
}
