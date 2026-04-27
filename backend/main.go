package main

import (
	"fmt"
	"log"
	"os"

	"github.com/SodiumZar/final-backend.git/config"
	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// ─────────────────────────────────────────────────────────────
	// LANGKAH 1: Load environment variables dari file .env
	// Jika file .env tidak ada (misal di production Railway),
	// env var sudah diset langsung di sistem dan tidak perlu file .env
	// ─────────────────────────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		// Ini bukan fatal error — di Railway, env var diset via dashboard
		log.Println("⚠️  File .env tidak ditemukan, menggunakan environment variable sistem")
	}

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 2: Set mode Gin berdasarkan environment
	// GIN_MODE=release untuk production, debug untuk development
	// ─────────────────────────────────────────────────────────────
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode // Default ke debug jika tidak diset
	}
	gin.SetMode(ginMode)

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 3: Koneksikan ke MongoDB Atlas
	// Program akan berhenti (fatal) jika koneksi gagal
	// ─────────────────────────────────────────────────────────────
	config.ConnectDatabase()

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 4: Inisialisasi Gin router
	// gin.New() lebih ringan dari gin.Default() karena tidak
	// include logger dan recovery middleware bawaan
	// ─────────────────────────────────────────────────────────────
	r := gin.New()

	// Tambahkan middleware Recovery secara manual
	// Agar server tidak crash saat ada panic di handler
	r.Use(gin.Recovery())

	// Tambahkan logger hanya saat mode development
	if ginMode != gin.ReleaseMode {
		r.Use(gin.Logger())
	}

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 5: Terapkan CORS middleware
	// Harus dipasang sebelum routes agar berlaku untuk semua request
	// ─────────────────────────────────────────────────────────────
	r.Use(middleware.CORSMiddleware())

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 6: Daftarkan semua routes API
	// ─────────────────────────────────────────────────────────────
	routes.SetupRoutes(r)

	// ─────────────────────────────────────────────────────────────
	// LANGKAH 7: Jalankan server pada port yang dikonfigurasi
	// Railway otomatis mengeset variabel PORT
	// ─────────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // Default port untuk development lokal
	}

	// Tampilkan informasi startup
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("🚀 UKM Management API Server")
	fmt.Printf("   Mode    : %s\n", ginMode)
	fmt.Printf("   Port    : %s\n", port)
	fmt.Printf("   Health  : http://localhost:%s/health\n", port)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Jalankan server — ini akan memblokir hingga server dihentikan
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌ Gagal menjalankan server: %v", err)
	}
}
