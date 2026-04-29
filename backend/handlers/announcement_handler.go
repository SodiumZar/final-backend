package handlers

import (
	"net/http"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// AnnouncementHandler menangani semua request HTTP yang berkaitan dengan pengumuman
type AnnouncementHandler struct {
	announcementService *services.AnnouncementService
}

// NewAnnouncementHandler membuat instance baru AnnouncementHandler
func NewAnnouncementHandler(announcementService *services.AnnouncementService) *AnnouncementHandler {
	return &AnnouncementHandler{announcementService: announcementService}
}

// GetAllAnnouncements menangani GET /api/announcements
// Menampilkan semua pengumuman dari semua UKM (public)
func (h *AnnouncementHandler) GetAllAnnouncements(c *gin.Context) {
	announcements, err := h.announcementService.GetAllAnnouncements(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar pengumuman",
		"data":    announcements,
	})
}

// GetAnnouncementsByUKM menangani GET /api/ukms/:id/announcements
// Menampilkan semua pengumuman dari UKM tertentu (public)
func (h *AnnouncementHandler) GetAnnouncementsByUKM(c *gin.Context) {
	ukmID := c.Param("id")

	announcements, err := h.announcementService.GetAnnouncementsByUKMID(c.Request.Context(), ukmID)
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
		"message": "Berhasil mengambil pengumuman UKM",
		"data":    announcements,
	})
}

// GetAnnouncementByID menangani GET /api/announcements/:id
// Menampilkan detail satu pengumuman (public)
func (h *AnnouncementHandler) GetAnnouncementByID(c *gin.Context) {
	announcementID := c.Param("id")

	announcement, err := h.announcementService.GetAnnouncementByID(c.Request.Context(), announcementID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "pengumuman tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "ID pengumuman tidak valid" {
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
		"message": "Berhasil mengambil detail pengumuman",
		"data":    announcement,
	})
}

// CreateAnnouncement menangani POST /api/ukms/:id/announcements
// Admin atau pengurus UKM bisa membuat pengumuman baru
// Hanya bisa dibuat untuk UKM yang berstatus active
func (h *AnnouncementHandler) CreateAnnouncement(c *gin.Context) {
	ukmID := c.Param("id")

	// Ambil data requester dari context
	creatorID := middleware.GetUserIDFromContext(c)
	creatorRole := middleware.GetUserRoleFromContext(c)

	if creatorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	// Jika bukan admin, pastikan user adalah pengurus UKM ini
	// Validasi dilakukan di service layer
	_ = creatorRole // Digunakan secara implisit oleh service

	var req models.CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	announcement, err := h.announcementService.CreateAnnouncement(
		c.Request.Context(),
		ukmID,
		&req,
		creatorID,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk membuat pengumuman ini" {
			statusCode = http.StatusForbidden
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Pengumuman berhasil dibuat",
		"data":    announcement,
	})
}

// UpdateAnnouncement menangani PUT /api/announcements/:id
// Hanya pembuat pengumuman atau admin yang bisa mengubah
func (h *AnnouncementHandler) UpdateAnnouncement(c *gin.Context) {
	announcementID := c.Param("id")

	requesterID := middleware.GetUserIDFromContext(c)
	requesterRole := middleware.GetUserRoleFromContext(c)

	if requesterID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	var req models.UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	// Validasi: minimal satu field harus diisi
	if req.Title == "" && req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Minimal satu field (title atau content) harus diisi",
		})
		return
	}

	announcement, err := h.announcementService.UpdateAnnouncement(
		c.Request.Context(),
		announcementID,
		&req,
		requesterID,
		requesterRole,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "pengumuman tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk mengubah pengumuman ini" {
			statusCode = http.StatusForbidden
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Pengumuman berhasil diperbarui",
		"data":    announcement,
	})
}

// DeleteAnnouncement menangani DELETE /api/announcements/:id
// Hanya pembuat pengumuman atau admin yang bisa menghapus
func (h *AnnouncementHandler) DeleteAnnouncement(c *gin.Context) {
	announcementID := c.Param("id")

	requesterID := middleware.GetUserIDFromContext(c)
	requesterRole := middleware.GetUserRoleFromContext(c)

	if requesterID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	if err := h.announcementService.DeleteAnnouncement(
		c.Request.Context(),
		announcementID,
		requesterID,
		requesterRole,
	); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "pengumuman tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk menghapus pengumuman ini" {
			statusCode = http.StatusForbidden
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Pengumuman berhasil dihapus",
	})
}
