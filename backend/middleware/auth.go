package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims mendefinisikan struktur payload yang disimpan di dalam JWT token
type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware memvalidasi JWT token dari header Authorization
// Digunakan untuk melindungi route yang memerlukan login
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil header Authorization dari request
		authHeader := c.GetHeader("Authorization")

		// Cek apakah header Authorization ada
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Token autentikasi tidak ditemukan",
			})
			return
		}

		// Format yang valid: "Bearer <token>"
		// Pisahkan menjadi dua bagian
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Format token tidak valid, gunakan: Bearer <token>",
			})
			return
		}

		tokenString := parts[1]

		// Ambil JWT secret dari environment variable
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Konfigurasi server tidak lengkap",
			})
			return
		}

		// Parse dan validasi token JWT
		token, err := jwt.ParseWithClaims(
			tokenString,
			&JWTClaims{},
			func(token *jwt.Token) (interface{}, error) {
				// Pastikan algoritma yang digunakan adalah HMAC (HS256)
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			},
		)

		// Tangani error parsing token
		if err != nil {
			message := "Token tidak valid"

			// Berikan pesan yang lebih spesifik sesuai jenis error
			if strings.Contains(err.Error(), "expired") {
				message = "Token sudah kedaluwarsa, silakan login kembali"
			}

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": message,
			})
			return
		}

		// Ekstrak claims dari token yang sudah tervalidasi
		claims, ok := token.Claims.(*JWTClaims)
		if !ok || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Token tidak dapat diproses",
			})
			return
		}

		// Simpan data user dari claims ke context Gin
		// Bisa diakses di handler dengan: c.GetString("user_id"), dll.
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)

		// Lanjutkan ke handler berikutnya
		c.Next()
	}
}
