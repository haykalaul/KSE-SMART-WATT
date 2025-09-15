package service

import (
	"database/sql"
	"errors"
	"time"

	"smart-home-energy-management-server/internal/entity"
	"smart-home-energy-management-server/internal/helper"
	"smart-home-energy-management-server/internal/repository"
)

type UsersService interface {
	Register(user entity.UsersRequest) (entity.Users, error)
	Login(user entity.UsersRequest) (*string, error)
	OAuthLogin(name string, email string, premium bool) (*string, error)
	GetAllUsers() ([]entity.Users, error)
	GetUserByID(id string) (entity.Users, error)
	GetUserByEmail(email string) (entity.Users, error)
	UpdateUser(id string, userNew entity.UsersRequest) (entity.Users, error)
	VerifyUser(email string) (entity.Users, error)
	DeleteUser(id string) (entity.Users, error)
	SetPremium(email string) (entity.Users, error)
}

type usersService struct {
	userRepository repository.UsersRepository
}

func NewUsersService(usersRepository repository.UsersRepository) UsersService {
	return &usersService{usersRepository}
}

func (user_serv *usersService) Register(user entity.UsersRequest) (entity.Users, error) {
	// VALIDASI APAKAH NAME, EMAIL, PASSWORD KOSONG
	if user.Name == "" || user.Email == "" || user.Password == "" {
		return entity.Users{}, errors.New("name, email, and password cannot be blank")
	}

	// VALIDASI UNTUK FORMAT EMAIL SUDAH BENAR
	if isValid := helper.EmailValidator(user.Email); !isValid {
		return entity.Users{}, errors.New("please enter a valid email address")
	}

	// MENGECEK APAKAH EMAIL SUDAH DIGUNAKAN
	userExist, err := user_serv.userRepository.GetUserByEmail(user.Email)
	if err == nil && (userExist.Email != "") {
		return entity.Users{}, errors.New("email already exists")
	}

	// VALIDASI PASSWORD SUDAH SESUAI, MIN 8 KARAKTER, MENGANDUNG ALFABET DAN NUMERIK
	hasMinLen, hasLetter, hasDigit := helper.PasswordValidator(user.Password)
	if !hasMinLen {
		return entity.Users{}, errors.New("password must be at least 8 characters long")
	}
	if !hasLetter {
		return entity.Users{}, errors.New("password must contain at least one letter")
	}
	if !hasDigit {
		return entity.Users{}, errors.New("password must contain at least one number")
	}

	// HASHING PASSWORD MENGGUNAKAN BCRYPT
	hashedPassword, err := helper.PasswordHashing(user.Password)
	if err != nil {
		return entity.Users{}, err
	}
	user.Password = hashedPassword

	//  MENGUBAH TIPE USER REQUEST KE ENTITY USER
	newUser := entity.Users{
		Name:     user.Name,
		Email:    user.Email,
		Password: user.Password,
	}

	return user_serv.userRepository.CreateUser(newUser)
}

func (user_serv *usersService) Login(user entity.UsersRequest) (*string, error) {
	// VALIDASI APAKAH EMAIL DAN PASSWORD KOSONG
	if user.Email == "" || user.Password == "" {
		return nil, errors.New("email and password cannot be blank")
	}

	// MENGECEK APAKAH USER SUDAH TERDAFTAR
	userExist, err := user_serv.userRepository.GetUserByEmail(user.Email)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// VALIDASI APAKAH PASSWORD SUDAH SESUAI
	if !helper.ComparePass(userExist.Password, user.Password) {
		return nil, errors.New("password is incorrect")
	}

	token, err := helper.GenerateToken(userExist.Name, userExist.Email, userExist.Premium)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

func (user_serv *usersService) OAuthLogin(name string, email string, premium bool) (*string, error) {
	token, err := helper.GenerateToken(name, email, premium)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

func (user_serv *usersService) GetAllUsers() ([]entity.Users, error) {
	return user_serv.userRepository.GetAllUsers()
}

func (user_serv *usersService) GetUserByID(id string) (entity.Users, error) {
	return user_serv.userRepository.GetUserByID(id)
}

func (user_serv *usersService) GetUserByEmail(email string) (entity.Users, error) {
	return user_serv.userRepository.GetUserByEmail(email)
}

func (user_serv *usersService) UpdateUser(id string, userNew entity.UsersRequest) (entity.Users, error) {
	// MENGAMBIL DATA YANG INGIN DI UPDATE
	user, err := user_serv.userRepository.GetUserByID(id)
	if err != nil {
		return entity.Users{}, err
	}

	// VALIDASI APAKAH FULLNAME & EMAIL KOSONG
	if userNew.Name == "" && userNew.Email == "" {
		return entity.Users{}, errors.New("fullname and email cannot be blank")
	}

	// VALIDASI APAKAH FULLNAME / EMAIL SUDAH DI INPUT
	if userNew.Name != "" {
		user.Name = userNew.Name
	}

	if userNew.Email != "" {
		// VALIDASI UNTUK FORMAT EMAIL SUDAH BENAR
		if isValid := helper.EmailValidator(userNew.Email); !isValid {
			return entity.Users{}, errors.New("please enter a valid email address")
		}
		// MENGECEK APAKAH EMAIL SUDAH DIGUNAKAN
		existingUser, err := user_serv.userRepository.GetUserByEmail(userNew.Email)
		if err == nil && existingUser.ID != user.ID {
			return entity.Users{}, errors.New("email already in use by another user")
		}
		user.Email = userNew.Email
	}

	return user_serv.userRepository.UpdateUser(user)
}

func (user_serv *usersService) VerifyUser(email string) (entity.Users, error) {
	// MENGAMBIL DATA YANG INGIN DI UPDATE
	user, err := user_serv.userRepository.GetUserByEmail(email)
	if err != nil {
		return entity.Users{}, err
	}

	current := time.Now()
	user.EmailVerfiedAt = sql.NullTime{
		Time:  current,
		Valid: true,
	}

	return user_serv.userRepository.UpdateUser(user)
}

func (user_serv *usersService) DeleteUser(id string) (entity.Users, error) {
	// MENGAMBIL DATA YANG INGIN DI DELETE
	user, err := user_serv.userRepository.GetUserByID(id)
	if err != nil {
		return entity.Users{}, err
	}

	return user_serv.userRepository.DeleteUser(user)
}

func (user_serv *usersService) SetPremium(email string) (entity.Users, error) {
	// MENGAMBIL DATA YANG INGIN DI UPDATE
	user, err := user_serv.userRepository.GetUserByEmail(email)
	if err != nil {
		return entity.Users{}, err
	}

	user.Premium = true

	return user_serv.userRepository.UpdateUser(user)
}