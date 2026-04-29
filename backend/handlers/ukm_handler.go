package handlers

import (
	"net/http"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// UKMHandler menangani semua request HTTP yang berkaitan dengan UKM
type UKMHandler struct {
	ukmService *services.UKMService
}

// NewUKMHandler membuat instance baru UKMHandler
func NewUKMHandler(ukmService *services.UKMService) *UKMHandler {
	return &UKMHandler{ukmService: ukmService}
}

// GetAllUKMs menangani GET /api/ukms
// Public: hanya menampilkan UKM yang berstatus active
// Admin: menampilkan semua UKM termasuk pending dan inactive
func (h *UKMHandler) GetAllUKMs(c *gin.Context) {
	// Cek apakah request dari admin berdasarkan role di context
	// Jika tidak ada role (public), tampilkan hanya yang active
	userRole := middleware.GetUserRoleFromContext(c)
	onlyActive := userRole != "admin"

	ukms, err := h.ukmService.GetAllUKMs(c.Request.Context(), onlyActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar UKM",
		"data":    ukms,
	})
}

// GetAllUKMsAdmin menangani GET /api/admin/ukms
// Hanya admin, menampilkan semua UKM termasuk pending dan inactive
func (h *UKMHandler) GetAllUKMsAdmin(c *gin.Context) {
	ukms, err := h.ukmService.GetAllUKMs(c.Request.Context(), false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar UKM (admin)",
		"data":    ukms,
	})
}

// GetUKMByID menangani GET /api/ukms/:id
// Menampilkan detail UKM berdasarkan ID
func (h *UKMHandler) GetUKMByID(c *gin.Context) {
	ukmID := c.Param("id")

	ukm, err := h.ukmService.GetUKMByID(c.Request.Context(), ukmID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "ID UKM tidak valid" {
			statusCode = http.StatusBadRequest
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil detail UKM",
		"data":    ukm,
	})
}

// CreateUKM menangani POST /api/ukms
// Hanya admin yang bisa membuat UKM baru
func (h *UKMHandler) CreateUKM(c *gin.Context) {
	var req models.CreateUKMRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	ukm, err := h.ukmService.CreateUKM(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "UKM berhasil dibuat, menunggu persetujuan admin",
		"data":    ukm,
	})
}

// UpdateUKM menangani PUT /api/ukms/:id
// Hanya admin yang bisa mengubah data UKM
func (h *UKMHandler) UpdateUKM(c *gin.Context) {
	ukmID := c.Param("id")

	var req models.UpdateUKMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	ukm, err := h.ukmService.UpdateUKM(c.Request.Context(), ukmID, &req)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Data UKM berhasil diperbarui",
		"data":    ukm,
	})
}

// UpdateUKMStatus menangani PATCH /api/ukms/:id/status
// Hanya admin yang bisa mengubah status UKM (pending/active/inactive)
func (h *UKMHandler) UpdateUKMStatus(c *gin.Context) {
	ukmID := c.Param("id")

	var req models.UpdateUKMStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	ukm, err := h.ukmService.UpdateUKMStatus(c.Request.Context(), ukmID, &req)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Status UKM berhasil diperbarui menjadi: " + string(ukm.Status),
		"data":    ukm,
	})
}

// DeleteUKM menangani DELETE /api/ukms/:id
// Hanya admin yang bisa menghapus UKM
// UKM tidak bisa dihapus jika masih ada anggota aktif
func (h *UKMHandler) DeleteUKM(c *gin.Context) {
	ukmID := c.Param("id")

	if err := h.ukmService.DeleteUKM(c.Request.Context(), ukmID); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "UKM berhasil dihapus",
	})
}
