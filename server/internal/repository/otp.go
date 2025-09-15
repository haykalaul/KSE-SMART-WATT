package repository

import (
	"context"
	"time"

	"github.com/go-redis/redis/v8"
)

type OTPRepository interface {
	SetOTP(email string, otp string, duration time.Duration) error
	ValidateOTP(email string, otp string) (bool, error)
}

type otpRepository struct {
	redis *redis.Client
}

func NewOTPRepository(redis *redis.Client) OTPRepository {
	return &otpRepository{redis}
}

func (otp_repo *otpRepository) SetOTP(email string, otp string, duration time.Duration) error {
	return otp_repo.redis.Set(context.Background(), email, otp, duration).Err()
}

func (otp_repo *otpRepository) ValidateOTP(email string, otp string) (bool, error) {
	savedOTP, err := otp_repo.redis.Get(context.Background(), email).Result()
	if err != nil {
		return false, err
	}

	return savedOTP == otp, nil
}
