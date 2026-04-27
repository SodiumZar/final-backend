package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware mengatur izin Cross-Origin Resource Sharing
// agar frontend (domain berbeda) bisa mengakses API backend
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil daftar origin yang diizinkan dari environment variable
		// Contoh: "http://localhost:5173,https://ukm.vercel.app"
		allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")

		// Pisahkan string menjadi slice
		allowedOrigins := strings.Split(allowedOriginsEnv, ",")

		// Bersihkan spasi di setiap origin
		for i, origin := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(origin)
		}

		// Ambil origin dari request yang masuk
		requestOrigin := c.Request.Header.Get("Origin")

		// Cek apakah origin request ada di daftar yang diizinkan
		originAllowed := false
		for _, allowed := range allowedOrigins {
			if allowed == requestOrigin {
				originAllowed = true
				break
			}
		}

		// Jika origin diizinkan, set header CORS
		if originAllowed {
			c.Header("Access-Control-Allow-Origin", requestOrigin)
		} else if allowedOriginsEnv == "" {
			// Jika tidak ada konfigurasi, izinkan semua (hanya untuk development)
			c.Header("Access-Control-Allow-Origin", "*")
		}

		// Header yang diizinkan dalam request
		c.Header("Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-Requested-With, Accept, Origin",
		)

		// Method HTTP yang diizinkan
		c.Header("Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS",
		)

		// Izinkan pengiriman credentials (cookie, authorization header)
		c.Header("Access-Control-Allow-Credentials", "true")

		// Cache preflight request selama 12 jam (43200 detik)
		c.Header("Access-Control-Max-Age", "43200")

		// Tangani preflight request (OPTIONS) - browser mengirim ini sebelum request asli
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204) // 204 No Content
			return
		}

		// Lanjutkan ke handler berikutnya
		c.Next()
	}
}
