package db

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
	_logger "github.com/johannesbuehl/golunteer/backend/pkg/logger"
)

var logger = _logger.Logger
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

// query the database
func SelectOld[T any](table string, where string, args ...any) ([]T, error) {
	// validate columns against struct T
	tType := reflect.TypeOf(new(T)).Elem()
	columns := make([]string, tType.NumField())

	validColumns := make(map[string]any)
	for ii := 0; ii < tType.NumField(); ii++ {
		field := tType.Field(ii)
		validColumns[strings.ToLower(field.Name)] = struct{}{}
		columns[ii] = strings.ToLower(field.Name)
	}

	for _, col := range columns {
		if _, ok := validColumns[strings.ToLower(col)]; !ok {
			return nil, fmt.Errorf("invalid column: %s for struct type %T", col, new(T))
		}
	}

	// create the query
	completeQuery := fmt.Sprintf("SELECT %s FROM %s", strings.Join(columns, ", "), table)

	if where != "" && where != "*" {
		completeQuery = fmt.Sprintf("%s WHERE %s", completeQuery, where)
	}

	var rows *sql.Rows
	var err error

	if len(args) > 0 {
		DB.Ping()

		rows, err = DB.Query(completeQuery, args...)
	} else {
		DB.Ping()

		rows, err = DB.Query(completeQuery)
	}

	if err != nil {
		logger.Error().Msgf("database access failed with error %v", err)

		return nil, err
	}

	defer rows.Close()
	results := []T{}

	for rows.Next() {
		var lineResult T

		scanArgs := make([]any, len(columns))
		v := reflect.ValueOf(&lineResult).Elem()

		for ii, col := range columns {
			field := v.FieldByName(col)

			if field.IsValid() && field.CanSet() {
				scanArgs[ii] = field.Addr().Interface()
			} else {
				logger.Warn().Msgf("Field %s not found in struct %T", col, lineResult)
				scanArgs[ii] = new(any) // save dummy value
			}
		}

		// scan the row into the struct
		if err := rows.Scan(scanArgs...); err != nil {
			logger.Warn().Msgf("Scan-error: %v", err)

			return nil, err
		}

		results = append(results, lineResult)
	}

	if err := rows.Err(); err != nil {
		logger.Error().Msgf("rows-error: %v", err)
		return nil, err
	} else {
		return results, nil
	}
}

// insert data intot the databse
func Insert(table string, vals any) error {
	// extract columns from vals
	v := reflect.ValueOf(vals)
	t := v.Type()

	columns := make([]string, t.NumField())
	values := make([]any, t.NumField())

	for ii := 0; ii < t.NumField(); ii++ {
		fieldValue := v.Field(ii)

		field := t.Field(ii)

		columns[ii] = strings.ToLower(field.Name)
		values[ii] = fieldValue.Interface()
	}

	placeholders := strings.Repeat(("?, "), len(columns))
	placeholders = strings.TrimSuffix(placeholders, ", ")

	completeQuery := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, strings.Join(columns, ", "), placeholders)

	_, err := DB.Exec(completeQuery, values...)

	return err
}

// update data in the database
func Update(table string, set, where any) error {
	setV := reflect.ValueOf(set)
	setT := setV.Type()

	setColumns := make([]string, setT.NumField())
	setValues := make([]any, setT.NumField())

	for ii := 0; ii < setT.NumField(); ii++ {
		fieldValue := setV.Field(ii)

		field := setT.Field(ii)

		setColumns[ii] = strings.ToLower(field.Name) + " = ?"
		setValues[ii] = fieldValue.Interface()
	}

	whereV := reflect.ValueOf(where)
	whereT := whereV.Type()

	whereColumns := make([]string, whereT.NumField())
	whereValues := make([]any, whereT.NumField())

	for ii := 0; ii < whereT.NumField(); ii++ {
		fieldValue := whereV.Field(ii)

		// skip empty (zero) values
		if !fieldValue.IsZero() {
			field := whereT.Field(ii)

			whereColumns[ii] = strings.ToLower(field.Name) + " = ?"
			whereValues[ii] = fmt.Sprint(fieldValue.Interface())
		}
	}

	sets := strings.Join(setColumns, ", ")
	wheres := strings.Join(whereColumns, " AND ")

	placeholderValues := append(setValues, whereValues...)

	completeQuery := fmt.Sprintf("UPDATE %s SET %s WHERE %s", table, sets, wheres)

	_, err := DB.Exec(completeQuery, placeholderValues...)

	return err
}

// remove data from the database
func Delete(table string, vals any) error {
	// extract columns from vals
	v := reflect.ValueOf(vals)
	t := v.Type()

	columns := make([]string, t.NumField())
	values := make([]any, t.NumField())

	for ii := 0; ii < t.NumField(); ii++ {
		fieldValue := v.Field(ii)

		// skip empty (zero) values
		if !fieldValue.IsZero() {
			field := t.Field(ii)

			columns[ii] = strings.ToLower(field.Name) + " = ?"
			values[ii] = fmt.Sprint(fieldValue.Interface())
		}
	}

	completeQuery := fmt.Sprintf("DELETE FROM %s WHERE %s", table, strings.Join(columns, ", "))

	_, err := DB.Exec(completeQuery, values...)

	return err
}
