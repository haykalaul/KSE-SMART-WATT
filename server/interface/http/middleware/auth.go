package middleware

import (
	"net/http"

	"smart-home-energy-management-server/internal/helper"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
    return gin.HandlerFunc(func(ctx *gin.Context) {
        authHeader := ctx.GetHeader("Authorization")
        if authHeader == "" {
            ctx.JSON(http.StatusUnauthorized, gin.H{
                "statusCode": 401,
                "status":     false,
                "error":      "Unauthorized",
            })
            ctx.Abort()
            return
        }

        // Periksa dan ambil token setelah "Bearer "
        const bearerPrefix = "Bearer "
        if len(authHeader) <= len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
            ctx.JSON(http.StatusUnauthorized, gin.H{
                "statusCode": 401,
                "status":     false,
                "error":      "Invalid Authorization header format",
            })
            ctx.Abort()
            return
        }

        token := authHeader[len(bearerPrefix):]

        // Verifikasi token
        userData, err := helper.VerifyToken(token)
        if err != nil {
            ctx.JSON(http.StatusUnauthorized, gin.H{
                "statusCode": 401,
                "status":     false,
                "error":      "Unauthorized",
            })
            ctx.Abort()
            return
        }

        // Simpan data user di context
        ctx.Set("user_data", userData)
        ctx.Next()
    })
}
