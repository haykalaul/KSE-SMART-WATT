package service

import (
	"time"

	"smart-home-energy-management-server/internal/repository"
)

type OTPService interface {
	SetOTP(email string, otp string, duration time.Duration) error
	ValidateOTP(email string, otp string) (bool, error)
}

type otpService struct {
	otpRepository repository.OTPRepository
}

func NewOTPService(otpRepository repository.OTPRepository) OTPService {
	return &otpService{otpRepository}
}

func (otpServ *otpService) SetOTP(email string, otp string, duration time.Duration) error {
	return otpServ.otpRepository.SetOTP(email, otp, duration)
}

func (otpServ *otpService) ValidateOTP(email string, otp string) (bool, error) {
	return otpServ.otpRepository.ValidateOTP(email, otp)
}
