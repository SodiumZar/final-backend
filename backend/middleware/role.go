package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole adalah middleware untuk membatasi akses berdasarkan role user
// Harus digunakan setelah AuthMiddleware karena butuh data dari context
//
// Contoh penggunaan:
//   router.POST("/ukms", AuthMiddleware(), RequireRole("admin"), handler)
//   router.POST("/events", AuthMiddleware(), RequireRole("admin", "pengurus"), handler)
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil role user dari context (diset oleh AuthMiddleware)
		userRole, exists := c.Get("user_role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Informasi role tidak ditemukan, pastikan sudah login",
			})
			return
		}

		// Konversi ke string
		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Terjadi kesalahan saat memproses role",
			})
			return
		}

		// Cek apakah role user termasuk dalam role yang diizinkan
		allowed := false
		for _, role := range roles {
			if roleStr == role {
				allowed = true
				break
			}
		}

		// Jika role tidak diizinkan, tolak akses
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Anda tidak memiliki izin untuk mengakses resource ini",
			})
			return
		}

		// Role valid, lanjutkan ke handler berikutnya
		c.Next()
	}
}

// RequireAdmin adalah shortcut middleware khusus untuk role admin saja
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("admin")
}

// RequireAdminOrPengurus adalah shortcut middleware untuk admin dan pengurus UKM
// Catatan: pengecekan apakah user adalah pengurus UKM yang spesifik
// dilakukan di dalam handler/service, bukan di middleware ini
func RequireAdminOrPengurus() gin.HandlerFunc {
	return RequireRole("admin", "mahasiswa") // mahasiswa bisa jadi pengurus, dicek di handler
}

// GetUserIDFromContext adalah helper untuk mengambil user_id dari Gin context
// Mengembalikan string kosong jika tidak ditemukan
func GetUserIDFromContext(c *gin.Context) string {
	userID, exists := c.Get("user_id")
	if !exists {
		return ""
	}
	id, ok := userID.(string)
	if !ok {
		return ""
	}
	return id
}

// GetUserRoleFromContext adalah helper untuk mengambil role dari Gin context
func GetUserRoleFromContext(c *gin.Context) string {
	role, exists := c.Get("user_role")
	if !exists {
		return ""
	}
	roleStr, ok := role.(string)
	if !ok {
		return ""
	}
	return roleStr
}

// IsAdmin mengecek apakah user yang sedang login adalah admin
func IsAdmin(c *gin.Context) bool {
	return GetUserRoleFromContext(c) == "admin"
}
