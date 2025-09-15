package repository

import (
	"context"

	"github.com/go-redis/redis/v8"
)

type RedisRepository interface {
	Save(key, value string) error
	SaveList(key string, values []string) error
	Get(key string) (string, error)
	GetList(key string) ([]string, error)
}

type redisRepository struct {
	redis *redis.Client
}

func NewRedisRepository(redis *redis.Client) RedisRepository {
	return &redisRepository{redis}
}

func (r *redisRepository) Save(key, value string) error {
	return r.redis.Set(context.Background(), key, value, 0).Err()
}

func (r *redisRepository) SaveList(key string, values []string) error {
	for _, value := range values {
		if err := r.redis.LPush(context.Background(), key, value).Err(); err != nil {
			return err
		}
	}
	return nil
}

func (r *redisRepository) Get(key string) (string, error) {
	return r.redis.Get(context.Background(), key).Result()
}

func (r *redisRepository) GetList(key string) ([]string, error) {
	return r.redis.LRange(context.Background(), key, 0, -1).Result()
}
