package main

import (
	"log"
	"os"

	"smart-home-energy-management-server/config"
	"smart-home-energy-management-server/interface/http/router"

	"github.com/joho/godotenv"
)

func main() {
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Println("Error loading .env file")
		}
	}

	psql, err := config.SetupDatabase()
	redis := config.SetupRedisDatabase()

	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	port := os.Getenv("PORT")

	r := router.SetupRouter(psql, redis)
	r.Run(":" + port)
}
