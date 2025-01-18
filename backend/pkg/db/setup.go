package db

import (
	"bytes"
	"fmt"
	"math/rand/v2"
	"os"

	"github.com/google/uuid"
	_config "github.com/johannesbuehl/golunteer/backend/pkg/config"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"
)

func createPassword(l int) string {
	passwordChars := [...]string{`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`, `Ä`, `Ö`, `Ü`, `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`, `o`, `p`, `q`, `r`, `s`, `t`, `u`, `v`, `w`, `x`, `y`, `z`, `ä`, `ö`, `ü`, `ß`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `!`, `"`, `§`, `$`, `%`, `&`, `/`, `(`, `)`, `=`, `?`, `@`, `{`, `}`, `[`, `]`, `#`, `+`, `'`, `*`, `,`, `.`, `-`, `;`, `:`, `_`, `<`, `>`, `|`, `°`}
	var password string

	for ii := 0; ii < l; ii++ {
		password += passwordChars[rand.IntN(len(passwordChars))]
	}

	return password
}

func setup() {
	fmt.Println("Creating admin-password:")

	// create an admin-password
	const passwordLength = 20
	password := createPassword(passwordLength)

	// hash the admin-password
	if passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost); err != nil {
		panic(fmt.Errorf("can't generate password: %v", err))
	} else {
		fmt.Println("\thashed password")

		// create an admin-user
		user := struct {
			Name     string `db:"name"`
			Password []byte `db:"password"`
			Admin    bool   `db:"admin"`
			TokenID  string `db:"tokenID"`
		}{
			Name:     "admin",
			Password: passwordHash,
			Admin:    true,
			TokenID:  uuid.NewString(),
		}
		if _, err := DB.NamedExec("INSERT INTO USERS (name, password, tokenID, admin) VALUES (:name, :password, :tokenID, :admin)", &user); err != nil {
			panic(fmt.Errorf("can't insert admin-user into the database: %v", err))
		}

		fmt.Println("\twrote hashed password to database")
	}

	fmt.Printf("created user \"admin\" with password %s\n", password)

	// create a jwt-signature
	config.ClientSession.JwtSignature = createPassword(100)

	// write the modified config-file
	WriteConfig()

}

func WriteConfig() {
	buf := bytes.Buffer{}
	enc := yaml.NewEncoder(&buf)
	enc.SetIndent(2)
	// Can set default indent here on the encoder
	if err := enc.Encode(&config.ConfigYaml); err != nil {
		panic(err)
	} else {
		if err := os.WriteFile(_config.CONFIG_PATH, buf.Bytes(), 0644); err != nil {
			panic(err)
		}
	}
}
