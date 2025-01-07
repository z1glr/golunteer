package router

import "golang.org/x/crypto/bcrypt"

// hashes a password
func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

// validates a password against the password-rules
func validatePassword(password string) bool {
	return len(password) >= 12 && len(password) <= 64
}
