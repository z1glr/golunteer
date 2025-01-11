package db

import (
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
)

var config = _config.Config

// connection to database
var DB *sqlx.DB

func init() {
	// setup the database-connection
	sqlConfig := mysql.Config{
		AllowNativePasswords: true,
		Net:                  "tcp",
		User:                 config.Database.User,
		Passwd:               config.Database.Password,
		Addr:                 config.Database.Host,
		DBName:               config.Database.Database,
	}

	// connect to the database
	DB = sqlx.MustOpen("mysql", sqlConfig.FormatDSN())
	DB.SetMaxIdleConns(10)
	DB.SetMaxIdleConns(100)
	DB.SetConnMaxLifetime(time.Minute)

}
