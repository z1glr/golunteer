package db

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/jmoiron/sqlx"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
	_ "modernc.org/sqlite" // SQLite driver
)

var config = _config.Config

// connection to database
var DB *sqlx.DB

func init() {
	// connect to the database
	DB = sqlx.MustOpen("sqlite", config.Database)

	DB.MustExec("PRAGMA foreign_keys = ON")

	// create the tables if they don't exist
	if dbSetupInstructions, err := os.ReadFile("setup.sql"); err != nil {
		panic("can't read database-setup")
	} else {
		DB.MustExec(string(dbSetupInstructions))

		// take wether the admin-user is present as an indicator to a new instance
		var admin struct {
			Admin bool `db:"admin"`
		}
		if err := DB.QueryRowx("SELECT admin FROM USERS WHERE name = 'admin'").StructScan(&admin); err != nil {
			// if the error isn't because there was no result, it's a real one
			if err != sql.ErrNoRows {
				panic(fmt.Errorf("can't query for the admin-user: %v", err))
			} else {
				// setup everything
				setup()
				fmt.Println("setup completed")

				// reload the config
				_config.LoadConfig()
			}
		}
	}
}
