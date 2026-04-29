package handlers

import (
	"net/http"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// EventHandler menangani semua request HTTP yang berkaitan dengan event
type EventHandler struct {
	eventService *services.EventService
}

// NewEventHandler membuat instance baru EventHandler
func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

// GetAllEvents menangani GET /api/events
// Menampilkan semua event dari semua UKM (public)
func (h *EventHandler) GetAllEvents(c *gin.Context) {
	events, err := h.eventService.GetAllEvents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar event",
		"data":    events,
	})
}

// GetEventsByUKM menangani GET /api/ukms/:id/events
// Menampilkan semua event dari UKM tertentu (public)
func (h *EventHandler) GetEventsByUKM(c *gin.Context) {
	ukmID := c.Param("id")

	events, err := h.eventService.GetEventsByUKMID(c.Request.Context(), ukmID)
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
		"message": "Berhasil mengambil daftar event UKM",
		"data":    events,
	})
}

// GetEventByID menangani GET /api/events/:id
// Menampilkan detail event beserta informasi sisa quota (public)
func (h *EventHandler) GetEventByID(c *gin.Context) {
	eventID := c.Param("id")

	event, err := h.eventService.GetEventByID(c.Request.Context(), eventID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "event tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "ID event tidak valid" {
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
		"message": "Berhasil mengambil detail event",
		"data":    event,
	})
}

// CreateEvent menangani POST /api/ukms/:id/events
// Admin atau pengurus UKM bisa membuat event baru
func (h *EventHandler) CreateEvent(c *gin.Context) {
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

	// Jika bukan admin, cek apakah user adalah pengurus UKM ini
	if creatorRole != "admin" {
		// Validasi akses dilakukan di service layer dengan cek IsUserPengurusOfUKM
		// Di sini kita lanjutkan dan biarkan service yang menolak jika tidak berhak
	}

	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	event, err := h.eventService.CreateEvent(
		c.Request.Context(),
		ukmID,
		&req,
		creatorID,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "UKM tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk membuat event ini" {
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
		"message": "Event berhasil dibuat",
		"data":    event,
	})
}

// UpdateEvent menangani PUT /api/events/:id
// Admin atau pengurus UKM pemilik event bisa mengubah data event
func (h *EventHandler) UpdateEvent(c *gin.Context) {
	eventID := c.Param("id")

	requesterID := middleware.GetUserIDFromContext(c)
	requesterRole := middleware.GetUserRoleFromContext(c)

	if requesterID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	var req models.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	event, err := h.eventService.UpdateEvent(
		c.Request.Context(),
		eventID,
		&req,
		requesterID,
		requesterRole,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "event tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk mengubah event ini" {
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
		"message": "Event berhasil diperbarui",
		"data":    event,
	})
}

// DeleteEvent menangani DELETE /api/events/:id
// Admin atau pengurus UKM bisa menghapus event
// Event tidak bisa dihapus jika ada peserta yang sudah diapprove
func (h *EventHandler) DeleteEvent(c *gin.Context) {
	eventID := c.Param("id")

	requesterID := middleware.GetUserIDFromContext(c)
	requesterRole := middleware.GetUserRoleFromContext(c)

	if requesterID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	if err := h.eventService.DeleteEvent(
		c.Request.Context(),
		eventID,
		requesterID,
		requesterRole,
	); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "event tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk menghapus event ini" {
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
		"message": "Event berhasil dihapus",
	})
}

// RegisterToEvent menangani POST /api/events/:id/register
// User yang sudah login bisa mendaftar ke event yang berstatus upcoming
func (h *EventHandler) RegisterToEvent(c *gin.Context) {
	eventID := c.Param("id")

	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	registrant, err := h.eventService.RegisterToEvent(
		c.Request.Context(),
		eventID,
		userID,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "event tidak ditemukan" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Berhasil mendaftar ke event, menunggu persetujuan panitia",
		"data":    registrant,
	})
}

// GetEventRegistrants menangani GET /api/events/:id/registrants
// Admin atau pengurus UKM pemilik event bisa melihat daftar pendaftar
func (h *EventHandler) GetEventRegistrants(c *gin.Context) {
	eventID := c.Param("id")

	registrants, err := h.eventService.GetEventRegistrants(c.Request.Context(), eventID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "event tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "ID event tidak valid" {
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
		"message": "Berhasil mengambil daftar pendaftar event",
		"data":    registrants,
	})
}

// UpdateRegistrantStatus menangani PATCH /api/events/:id/registrants/:uid
// Admin atau pengurus UKM bisa approve/reject pendaftar event
// uid di sini adalah ID dari record event_registrant (bukan user_id)
func (h *EventHandler) UpdateRegistrantStatus(c *gin.Context) {
	eventID := c.Param("id")
	registrantID := c.Param("uid")

	var req models.UpdateRegistrantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	registrant, err := h.eventService.UpdateRegistrantStatus(
		c.Request.Context(),
		eventID,
		registrantID,
		&req,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "event tidak ditemukan" || err.Error() == "data pendaftar tidak ditemukan" {
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
		"message": "Status pendaftar berhasil diperbarui menjadi: " + string(registrant.Status),
		"data":    registrant,
	})
}

// GetMyEvents menangani GET /api/users/me/events
// Menampilkan daftar event yang didaftarkan oleh user yang sedang login
func (h *EventHandler) GetMyEvents(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	events, err := h.eventService.GetMyEvents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar event yang diikuti",
		"data":    events,
	})
}
