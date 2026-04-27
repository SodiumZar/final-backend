package handlers

import (
	"net/http"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// AuthHandler menangani semua request HTTP yang berkaitan dengan autentikasi
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler membuat instance baru AuthHandler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register menangani POST /api/auth/register
// Mendaftarkan user baru ke sistem
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest

	// Bind dan validasi request body ke struct
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	// Panggil service untuk proses registrasi
	result, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Konversi user ke response (tanpa password)
	userResp := result.User.ToResponse()

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Registrasi berhasil",
		"data": gin.H{
			"token": result.Token,
			"user":  userResp,
		},
	})
}

// Login menangani POST /api/auth/login
// Memverifikasi kredensial dan mengembalikan JWT token
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	result, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		// Gunakan 401 untuk kredensial tidak valid
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Konversi user ke response (tanpa password)
	userResp := result.User.ToResponse()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Login berhasil",
		"data": gin.H{
			"token": result.Token,
			"user":  userResp,
		},
	})
}

// GetMe menangani GET /api/auth/me
// Mengembalikan data profil user yang sedang login
func (h *AuthHandler) GetMe(c *gin.Context) {
	// Ambil user_id dari context yang diset oleh AuthMiddleware
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	user, err := h.authService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Konversi ke response (tanpa password)
	userResp := user.ToResponse()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil data profil",
		"data":    userResp,
	})
}

// Logout menangani POST /api/auth/logout
// Karena JWT stateless, logout hanya perlu konfirmasi di sisi client
// Client yang bertanggung jawab menghapus token dari storage
func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Logout berhasil, silakan hapus token di sisi client",
	})
}

// formatValidationError mengkonversi error validasi Gin ke pesan yang ramah pengguna
func formatValidationError(err error) string {
	if err != nil {
		return "Data yang dikirim tidak valid: " + err.Error()
	}
	return "Data tidak valid"
}
