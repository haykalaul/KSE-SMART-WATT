package routes

import (
	"smart-home-energy-management-server/interface/http/handler"
	"smart-home-energy-management-server/internal/repository"
	"smart-home-energy-management-server/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

func FileRoutes(version *gin.RouterGroup, psql *gorm.DB, redis *redis.Client) {

	redisRepository := repository.NewRedisRepository(redis)

	fileService := service.NewFileService(redisRepository)
	recommendationService := service.NewRecommendationService(redisRepository)

	applianceRepository := repository.NewApplianceRepository(psql)
	applianceService := service.NewApplianceService(applianceRepository, redisRepository)

	fileHandler := handler.NewFileHandler(applianceService, fileService, recommendationService)

	version.POST("/upload", fileHandler.UploadFileCSV)
	version.GET("/table", fileHandler.GetTable)
	version.POST("/chat", fileHandler.Chat)
	version.POST("/tapas-chat", fileHandler.TapasChat)
	version.GET("/appliance", fileHandler.GetAppliance)
	version.GET("/all-appliances", fileHandler.GetAllAppliance)
	version.PUT("/set-daily-target", fileHandler.SetDailyTarget)
	version.POST("/get-daily-target", fileHandler.GetDailyTarget)
	version.POST("/generate-daily-recommendations", fileHandler.GenerateDailyRecommendations)
	version.POST("/generate-monthly-recommendations", fileHandler.GenerateMonthlyRecommendations)
}
