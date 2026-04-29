package handlers

import (
	"net/http"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// MemberHandler menangani semua request HTTP yang berkaitan dengan keanggotaan UKM
type MemberHandler struct {
	ukmService *services.UKMService
}

// NewMemberHandler membuat instance baru MemberHandler
func NewMemberHandler(ukmService *services.UKMService) *MemberHandler {
	return &MemberHandler{ukmService: ukmService}
}

// JoinUKM menangani POST /api/ukms/:id/join
// User yang sudah login bisa mendaftar ke UKM yang active
func (h *MemberHandler) JoinUKM(c *gin.Context) {
	ukmID := c.Param("id")

	// Ambil user ID dari context (diset oleh AuthMiddleware)
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	member, err := h.ukmService.JoinUKM(c.Request.Context(), ukmID, userID)
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

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Berhasil mendaftar ke UKM, menunggu persetujuan pengurus",
		"data":    member,
	})
}

// GetUKMMembers menangani GET /api/ukms/:id/members
// Menampilkan semua anggota UKM beserta detail user
// Hanya bisa diakses oleh user yang login (anggota, pengurus, atau admin)
func (h *MemberHandler) GetUKMMembers(c *gin.Context) {
	ukmID := c.Param("id")

	members, err := h.ukmService.GetUKMMembers(c.Request.Context(), ukmID)
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
		"message": "Berhasil mengambil daftar anggota UKM",
		"data":    members,
	})
}

// UpdateMember menangani PATCH /api/ukms/:id/members/:uid
// Admin atau pengurus UKM bisa mengubah role dan status anggota
// uid di sini adalah ID dari record ukm_member (bukan user_id)
func (h *MemberHandler) UpdateMember(c *gin.Context) {
	ukmID := c.Param("id")
	memberID := c.Param("uid")

	// Ambil data requester dari context
	requesterID := middleware.GetUserIDFromContext(c)
	requesterRole := middleware.GetUserRoleFromContext(c)

	if requesterID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	var req models.UpdateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": formatValidationError(err),
		})
		return
	}

	// Validasi: minimal satu field harus diisi
	if req.Role == "" && req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Minimal satu field (role atau status) harus diisi",
		})
		return
	}

	// Jika bukan admin, cek apakah requester adalah pengurus UKM ini
	// (validasi dilakukan di service layer)
	member, err := h.ukmService.UpdateMember(
		c.Request.Context(),
		ukmID,
		memberID,
		&req,
		requesterID,
	)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "data keanggotaan tidak ditemukan" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "anda tidak memiliki hak untuk mengubah anggota ini" {
			statusCode = http.StatusForbidden
		}

		// Jika bukan admin, hanya pengurus UKM yang bisa update
		if requesterRole != "admin" {
			// Cek apakah pengurus UKM tersebut
			// Jika error karena hak akses, kembalikan 403
			if err.Error() == "anda tidak memiliki hak" {
				statusCode = http.StatusForbidden
			}
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Data anggota berhasil diperbarui",
		"data":    member,
	})
}

// DeleteMember menangani DELETE /api/ukms/:id/members/:uid
// Admin atau pengurus UKM bisa menghapus anggota dari UKM
// uid di sini adalah ID dari record ukm_member (bukan user_id)
func (h *MemberHandler) DeleteMember(c *gin.Context) {
	ukmID := c.Param("id")
	memberID := c.Param("uid")

	if err := h.ukmService.DeleteMember(c.Request.Context(), ukmID, memberID); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "data keanggotaan tidak ditemukan" {
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
		"message": "Anggota berhasil dihapus dari UKM",
	})
}

// GetMyUKMs menangani GET /api/users/me/ukms
// Menampilkan daftar UKM yang diikuti oleh user yang sedang login
func (h *MemberHandler) GetMyUKMs(c *gin.Context) {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Tidak terautentikasi",
		})
		return
	}

	ukms, err := h.ukmService.GetMyUKMs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Berhasil mengambil daftar UKM yang diikuti",
		"data":    ukms,
	})
}
