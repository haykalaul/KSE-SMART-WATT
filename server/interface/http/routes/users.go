package routes

import (
	"smart-home-energy-management-server/interface/http/handler"
	"smart-home-energy-management-server/interface/http/middleware"
	"smart-home-energy-management-server/internal/repository"
	"smart-home-energy-management-server/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

func UserRoutes(version *gin.RouterGroup, db *gorm.DB, redis *redis.Client) {
	User_repo := repository.NewUsersRepository(db)
	User_serv := service.NewUsersService(User_repo)

	OTP_repo := repository.NewOTPRepository(redis)
	OTP_serv := service.NewOTPService(OTP_repo)

	User_handler := handler.NewUsersHandler(User_serv, OTP_serv)

	auth := version.Group("/auth")
	{
		auth.POST("login", User_handler.Login)
		auth.POST("register", User_handler.Register)
		auth.POST("send/otp", User_handler.SendOTP)
		auth.POST("verify/otp", User_handler.VerifyOTP)

		auth.GET("google/oauth", User_handler.OAuthHandler("google"))
		auth.GET("callback/google", User_handler.CallbackGoogle)
	}

	// Protect only user management routes with auth middleware
	protected := version.Group("/")
	protected.Use(middleware.AuthMiddleware())
	protected.GET("users", User_handler.GetAllUsers)
	protected.GET("users/:id", User_handler.GetUserByID)
	protected.PUT("users/:id", User_handler.UpdateUser)
	protected.DELETE("users/:id", User_handler.DeleteUser)
	protected.PUT("users/set-premium", User_handler.SetPremium)
}
