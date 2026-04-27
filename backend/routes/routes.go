package routes

import (
	"github.com/SodiumZar/final-backend.git/handlers"
	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/repositories"
	"github.com/SodiumZar/final-backend.git/services"

	"github.com/gin-gonic/gin"
)

// SetupRoutes menginisialisasi semua dependency dan mendaftarkan semua route API
func SetupRoutes(r *gin.Engine) {

	// ─────────────────────────────────────────────────────────────
	// INISIALISASI REPOSITORIES
	// Repositories bertugas langsung berkomunikasi dengan MongoDB
	// ─────────────────────────────────────────────────────────────
	userRepo := repositories.NewUserRepository()
	ukmRepo := repositories.NewUKMRepository()
	eventRepo := repositories.NewEventRepository()
	announcementRepo := repositories.NewAnnouncementRepository()

	// ─────────────────────────────────────────────────────────────
	// INISIALISASI SERVICES
	// Services berisi logika bisnis, menggunakan repositories
	// ─────────────────────────────────────────────────────────────
	authService := services.NewAuthService(userRepo)
	ukmService := services.NewUKMService(ukmRepo, userRepo)
	eventService := services.NewEventService(eventRepo, ukmRepo, userRepo)
	announcementService := services.NewAnnouncementService(announcementRepo, ukmRepo)

	// ─────────────────────────────────────────────────────────────
	// INISIALISASI HANDLERS
	// Handlers menerima request HTTP dan memanggil service yang sesuai
	// ─────────────────────────────────────────────────────────────
	authHandler := handlers.NewAuthHandler(authService)
	ukmHandler := handlers.NewUKMHandler(ukmService)
	memberHandler := handlers.NewMemberHandler(ukmService)
	eventHandler := handlers.NewEventHandler(eventService)
	announcementHandler := handlers.NewAnnouncementHandler(announcementService)

	// ─────────────────────────────────────────────────────────────
	// HEALTH CHECK ENDPOINT
	// Digunakan oleh Railway untuk memastikan aplikasi berjalan
	// ─────────────────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "success",
			"message": "UKM Management API berjalan dengan baik",
		})
	})

	// ─────────────────────────────────────────────────────────────
	// GROUP: /api
	// Semua endpoint API dikelompokkan di bawah prefix /api
	// ─────────────────────────────────────────────────────────────
	api := r.Group("/api")

	// ══════════════════════════════════════════════════════════════
	// PUBLIC ROUTES — tidak memerlukan autentikasi JWT
	// ══════════════════════════════════════════════════════════════

	// ── Auth ──────────────────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register) // Daftar akun baru
		auth.POST("/login", authHandler.Login)       // Login dan dapatkan token
	}

	// ── UKM (public read) ─────────────────────────────────────────
	// Publik hanya bisa melihat UKM yang active
	ukms := api.Group("/ukms")
	{
		ukms.GET("", ukmHandler.GetAllUKMs)                                       // Daftar semua UKM
		ukms.GET("/:id", ukmHandler.GetUKMByID)                                   // Detail UKM
		ukms.GET("/:id/events", eventHandler.GetEventsByUKM)                      // Event milik UKM
		ukms.GET("/:id/announcements", announcementHandler.GetAnnouncementsByUKM) // Pengumuman UKM
	}

	// ── Events (public read) ──────────────────────────────────────
	events := api.Group("/events")
	{
		events.GET("", eventHandler.GetAllEvents)     // Daftar semua event
		events.GET("/:id", eventHandler.GetEventByID) // Detail event + sisa quota
	}

	// ── Announcements (public read) ───────────────────────────────
	announcements := api.Group("/announcements")
	{
		announcements.GET("", announcementHandler.GetAllAnnouncements)     // Semua pengumuman
		announcements.GET("/:id", announcementHandler.GetAnnouncementByID) // Detail pengumuman
	}

	// ══════════════════════════════════════════════════════════════
	// PROTECTED ROUTES — memerlukan JWT token yang valid
	// Semua route di bawah ini wajib menyertakan:
	// Header: Authorization: Bearer <token>
	// ══════════════════════════════════════════════════════════════
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware()) // Terapkan middleware autentikasi
	{
		// ── Auth (protected) ──────────────────────────────────────
		protected.GET("/auth/me", authHandler.GetMe)       // Profil user yang sedang login
		protected.POST("/auth/logout", authHandler.Logout) // Logout (hapus token di client)

		// ── UKM — user actions ────────────────────────────────────
		protected.POST("/ukms/:id/join", memberHandler.JoinUKM)         // Daftar ke UKM
		protected.GET("/ukms/:id/members", memberHandler.GetUKMMembers) // Lihat anggota UKM

		// ── Events — user actions ─────────────────────────────────
		protected.POST("/events/:id/register", eventHandler.RegisterToEvent) // Daftar ke event

		// ── User personal data ────────────────────────────────────
		protected.GET("/users/me/ukms", memberHandler.GetMyUKMs)    // UKM yang diikuti
		protected.GET("/users/me/events", eventHandler.GetMyEvents) // Event yang didaftarkan
	}

	// ══════════════════════════════════════════════════════════════
	// ADMIN ONLY ROUTES — hanya bisa diakses oleh role "admin"
	// ══════════════════════════════════════════════════════════════
	adminOnly := api.Group("")
	adminOnly.Use(middleware.AuthMiddleware(), middleware.RequireAdmin())
	{
		adminOnly.GET("/admin/ukms", ukmHandler.GetAllUKMsAdmin) // Daftar semua UKM (termasuk pending)
		// ── UKM management ────────────────────────────────────────
		adminOnly.POST("/ukms", ukmHandler.CreateUKM)                   // Buat UKM baru
		adminOnly.PUT("/ukms/:id", ukmHandler.UpdateUKM)                // Update data UKM
		adminOnly.DELETE("/ukms/:id", ukmHandler.DeleteUKM)             // Hapus UKM
		adminOnly.PATCH("/ukms/:id/status", ukmHandler.UpdateUKMStatus) // Ubah status UKM
	}

	// ══════════════════════════════════════════════════════════════
	// ADMIN & PENGURUS ROUTES
	// Bisa diakses oleh admin atau pengurus UKM yang bersangkutan
	// Pengecekan apakah user adalah pengurus UKM yang spesifik
	// dilakukan di dalam service layer (bukan di middleware)
	// ══════════════════════════════════════════════════════════════
	adminOrPengurus := api.Group("")
	// Semua role yang sudah login bisa masuk ke sini,
	// tapi service akan menolak jika bukan admin atau pengurus UKM terkait
	adminOrPengurus.Use(middleware.AuthMiddleware())
	{
		// ── Event management ──────────────────────────────────────
		adminOrPengurus.POST("/ukms/:id/events", eventHandler.CreateEvent)               // Buat event
		adminOrPengurus.PUT("/events/:id", eventHandler.UpdateEvent)                     // Update event
		adminOrPengurus.DELETE("/events/:id", eventHandler.DeleteEvent)                  // Hapus event
		adminOrPengurus.GET("/events/:id/registrants", eventHandler.GetEventRegistrants) // Daftar pendaftar
		adminOrPengurus.PATCH(                                                           // Approve/reject pendaftar
			"/events/:id/registrants/:uid",
			eventHandler.UpdateRegistrantStatus,
		)

		// ── Member management ─────────────────────────────────────
		adminOrPengurus.PATCH( // Update role/status anggota
			"/ukms/:id/members/:uid",
			memberHandler.UpdateMember,
		)
		adminOrPengurus.DELETE( // Keluarkan anggota dari UKM
			"/ukms/:id/members/:uid",
			memberHandler.DeleteMember,
		)

		// ── Announcement management ───────────────────────────────
		adminOrPengurus.POST("/ukms/:id/announcements", announcementHandler.CreateAnnouncement) // Buat pengumuman
		adminOrPengurus.PUT("/announcements/:id", announcementHandler.UpdateAnnouncement)       // Update pengumuman
		adminOrPengurus.DELETE("/announcements/:id", announcementHandler.DeleteAnnouncement)    // Hapus pengumuman
	}
}
