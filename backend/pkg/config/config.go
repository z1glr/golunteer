package config

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/johannesbuehl/golunteer/backend/pkg/lib"
	"github.com/rs/zerolog"
	"gopkg.in/yaml.v3"
)

type ReservationConfig struct {
	Expiration time.Duration
}

type ConfigStruct struct {
	ConfigYaml
	LogLevel      zerolog.Level
	SessionExpire time.Duration
}

var Config ConfigStruct

type Payload struct {
	jwt.RegisteredClaims
	CustomClaims map[string]any
}

func (config ConfigStruct) SignJWT(val any) (string, error) {
	valMap, err := lib.StrucToMap(val)

	if err != nil {
		return "", err
	}

	payload := Payload{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.SessionExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		CustomClaims: valMap,
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, payload)

	return t.SignedString([]byte(config.ClientSession.JwtSignature))
}

func LoadConfig() ConfigStruct {
	ensureConfigExists()

	Config := ConfigYaml{}

	yamlFile, err := os.ReadFile(CONFIG_PATH)
	if err != nil {
		panic(fmt.Sprintf("Error opening config-file: %q", err))
	}

	reader := bytes.NewReader(yamlFile)

	dec := yaml.NewDecoder(reader)
	dec.KnownFields(true)
	err = dec.Decode(&Config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing config-file: %v", err)
		os.Exit(1)
	}

	if logLevel, err := zerolog.ParseLevel(Config.LogLevel); err != nil {
		panic(fmt.Errorf("can't parse log-level: %v", err))
	} else {
		var configStruct ConfigStruct

		// parse the durations
		if session_expire, err := time.ParseDuration(Config.ClientSession.Expire); err != nil {
			log.Fatalf(`Error parsing "client_session.expire": %v`, err)

			// parse the templates
		} else {
			configStruct = ConfigStruct{
				ConfigYaml:    Config,
				LogLevel:      logLevel,
				SessionExpire: session_expire,
			}
		}

		return configStruct
	}
}

func ensureConfigExists() {
	// if the config path doesn't exist, copy the example config there
	if _, err := os.Stat(CONFIG_PATH); errors.Is(err, os.ErrNotExist) {
		source, err := os.Open("config-default.yaml")

		if err == nil {
			defer source.Close()

			destination, err := os.Create(CONFIG_PATH)

			if err == nil {
				defer destination.Close()

				io.Copy(destination, source)
			}
		}
	}
}

func init() {
	// check for the config passed as an argument
	if len(os.Args) == 2 {
		CONFIG_PATH = os.Args[1]
	} else {
		CONFIG_PATH = "config.yaml"
	}

	Config = LoadConfig()
}
