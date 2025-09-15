package router

import (
	"smart-home-energy-management-server/interface/http/middleware"
	"smart-home-energy-management-server/interface/http/routes"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

func SetupRouter(psql *gorm.DB, redis *redis.Client) *gin.Engine {
	router := gin.Default()

	router.Use(middleware.CORSMiddleware())

	router.GET("test", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello World",
		})
	})

	v1 := router.Group("/v1")
	routes.UserRoutes(v1, psql, redis)
	routes.FileRoutes(v1, psql, redis)

	return router
}
