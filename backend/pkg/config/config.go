package config

import (
	"bytes"
	"fmt"
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

func loadConfig() ConfigStruct {
	Config := ConfigYaml{}

	yamlFile, err := os.ReadFile("config.yaml")
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

func init() {
	Config = loadConfig()
}
