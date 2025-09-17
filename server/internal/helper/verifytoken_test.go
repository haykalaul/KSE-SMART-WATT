package helper

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt"
)

func makeToken(t *testing.T, secret string, claims jwt.MapClaims) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func TestVerifyToken_ValidToken(t *testing.T) {
	secret := "testsecret123"
	os.Setenv("JWT_SECRET", secret)

	claims := jwt.MapClaims{
		"sub":  "123",
		"exp":  time.Now().Add(time.Hour).Unix(),
		"role": "user",
	}

	tok := makeToken(t, secret, claims)

	got, err := VerifyToken(tok)
	if err != nil {
		t.Fatalf("expected valid token, got error: %v", err)
	}

	m, ok := got.(jwt.MapClaims)
	if !ok {
		t.Fatalf("expected MapClaims, got %T", got)
	}
	if m["sub"] != "123" {
		t.Fatalf("expected sub claim 123, got %v", m["sub"])
	}
}

func TestVerifyToken_InvalidToken(t *testing.T) {
	secret := "testsecret123"
	os.Setenv("JWT_SECRET", secret)

	// random string should fail parse
	_, err := VerifyToken("not-a-jwt")
	if err == nil {
		t.Fatalf("expected error for invalid token, got nil")
	}
}

func TestVerifyToken_ExpiredToken(t *testing.T) {
	secret := "testsecret123"
	os.Setenv("JWT_SECRET", secret)

	claims := jwt.MapClaims{
		"sub": "123",
		"exp": time.Now().Add(-time.Hour).Unix(), // already expired
	}

	tok := makeToken(t, secret, claims)

	_, err := VerifyToken(tok)
	if err == nil {
		t.Fatalf("expected error for expired token, got nil")
	}
}
