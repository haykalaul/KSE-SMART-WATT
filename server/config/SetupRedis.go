package config

import (
	"log"
	"os"

	"github.com/go-redis/redis/v8"
)

var mode = func() string {
	m := os.Getenv("MODE")
	if m == "" {
		m = "development"
	}
	return m
}()

func SetupRedisDatabase() *redis.Client {
	var rdb *redis.Client
	if mode == "development" {
		rdb = redis.NewClient(&redis.Options{
			Addr: "localhost:6379",
		})
	} else if mode == "production" {
		redisAddr := os.Getenv("REDIS_URL")
		if redisAddr == "" {
			log.Fatal("REDIS_URL tidak ditemukan di environment variables")
		}

		opt, err := redis.ParseURL(redisAddr)
		if err != nil {
			log.Fatalf("Error parsing REDIS_URL: %v", err)
		}

		rdb = redis.NewClient(opt)
	}

	return rdb
}
