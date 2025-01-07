package config

import (
	"bytes"
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

var CONFIG_PATH = "config.yaml"

type ConfigYaml struct {
	LogLevel string `yaml:"log_level"`
	Database struct {
		Host     string `yaml:"host"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		Database string `yaml:"database"`
	} `yaml:"database"`
	Server struct {
		Port int `yaml:"port"`
	} `yaml:"server"`
	ClientSession struct {
		JwtSignature string `yaml:"jwt_signature"`
		Expire       string `yaml:"expire"`
	} `yaml:"client_session"`
}

type CacheConfig struct {
	Expiration time.Duration
	Purge      time.Duration
}

var YamlConfig ConfigYaml

func _loadConfig() ConfigYaml {
	config := ConfigYaml{}

	yamlFile, err := os.ReadFile(CONFIG_PATH)
	if err != nil {
		panic(fmt.Sprintf("Error opening config-file: %v", err))
	}

	reader := bytes.NewReader(yamlFile)

	dec := yaml.NewDecoder(reader)
	dec.KnownFields(true)
	err = dec.Decode(&config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing config-file: %v", err)
		os.Exit(1)
	}

	return config
}

func WriteConfig() {
	buf := bytes.Buffer{}
	enc := yaml.NewEncoder(&buf)
	enc.SetIndent(2)
	// Can set default indent here on the encoder
	if err := enc.Encode(&YamlConfig); err != nil {
		panic(err)
	} else {
		if err := os.WriteFile(CONFIG_PATH, buf.Bytes(), 0644); err != nil {
			panic(err)
		}
	}
}

func init() {
	YamlConfig = _loadConfig()
}
