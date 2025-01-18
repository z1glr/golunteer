package logger

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/johannesbuehl/golunteer/backend/pkg/config"
	"github.com/rs/zerolog"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Logger zerolog.Logger

type specificLevelWriter struct {
	io.Writer
	Level zerolog.Level
}

func (w specificLevelWriter) WriteLevel(l zerolog.Level, p []byte) (int, error) {
	if l >= w.Level {
		return w.Write(p)
	} else {
		return len(p), nil
	}
}

func init() {
	// try to set the log-level
	zerolog.SetGlobalLevel(config.Config.LogLevel)
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// create the console output
	outputConsole := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: time.DateTime,
		FormatLevel: func(i interface{}) string {
			if i == nil {
				return "| LOG   |"
			} else {
				return strings.ToUpper(fmt.Sprintf("| %-6s|", i))
			}
		},
		FormatFieldName: func(i interface{}) string {
			return fmt.Sprintf("%s", i)
		},
		NoColor: true,
	}

	// create the logfile output
	outputLog := &lumberjack.Logger{
		Filename:  "logs/backend.log",
		MaxAge:    7,
		LocalTime: true,
	}

	// create a multi-output-writer
	multi := zerolog.MultiLevelWriter(
		specificLevelWriter{
			Writer: outputConsole,
			Level:  config.Config.LogLevel,
		},
		specificLevelWriter{
			Writer: outputLog,
			Level:  config.Config.LogLevel,
		},
	)

	// create a logger-instance
	Logger = zerolog.New(multi).With().Timestamp().Logger()

}
