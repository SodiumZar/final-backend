package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DB adalah variabel global untuk instance database MongoDB
var DB *mongo.Database

// ConnectDatabase menginisialisasi koneksi ke MongoDB Atlas
func ConnectDatabase() {
	// Ambil URI MongoDB dari environment variable
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI tidak ditemukan di environment variable")
	}

	// Ambil nama database dari environment variable
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "ukm_management" // Gunakan nama default jika tidak diset
	}

	// Konfigurasi opsi koneksi MongoDB
	clientOptions := options.Client().
		ApplyURI(mongoURI).
		SetConnectTimeout(10 * time.Second).  // Timeout saat pertama connect
		SetServerSelectionTimeout(5 * time.Second) // Timeout saat pilih server

	// Buat context dengan timeout untuk proses connect
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Buka koneksi ke MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Gagal membuat koneksi MongoDB: %v", err)
	}

	// Ping database untuk memastikan koneksi berhasil
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Gagal ping MongoDB: %v", err)
	}

	// Set variabel global DB
	DB = client.Database(dbName)

	fmt.Printf("✅ Berhasil terhubung ke MongoDB Atlas - Database: %s\n", dbName)

	// Buat index untuk performa query yang lebih baik
	createIndexes()
}

// createIndexes membuat index pada collection yang sering di-query
func createIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// ── Index collection: users ──────────────────────────────────────────────
	// Index unique pada email agar tidak ada email duplikat
	usersCollection := DB.Collection("users")
	_, err := usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index email pada users: %v", err)
	}

	// Index unique pada NIM agar tidak ada NIM duplikat
	_, err = usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "nim", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index nim pada users: %v", err)
	}

	// ── Index collection: ukm_members ────────────────────────────────────────
	// Index compound pada user_id + ukm_id agar satu user tidak join UKM yang sama dua kali
	membersCollection := DB.Collection("ukm_members")
	_, err = membersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "ukm_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index compound pada ukm_members: %v", err)
	}

	// ── Index collection: event_registrants ──────────────────────────────────
	// Index compound pada event_id + user_id agar satu user tidak daftar event yang sama dua kali
	registrantsCollection := DB.Collection("event_registrants")
	_, err = registrantsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "event_id", Value: 1}, {Key: "user_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index compound pada event_registrants: %v", err)
	}

	// ── Index collection: events ─────────────────────────────────────────────
	// Index pada ukm_id untuk mempercepat query event berdasarkan UKM
	eventsCollection := DB.Collection("events")
	_, err = eventsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "ukm_id", Value: 1}},
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index ukm_id pada events: %v", err)
	}

	// ── Index collection: announcements ──────────────────────────────────────
	// Index pada ukm_id untuk mempercepat query pengumuman berdasarkan UKM
	announcementsCollection := DB.Collection("announcements")
	_, err = announcementsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "ukm_id", Value: 1}},
	})
	if err != nil {
		log.Printf("Peringatan: Gagal membuat index ukm_id pada announcements: %v", err)
	}

	fmt.Println("✅ Index MongoDB berhasil dibuat")
}

// GetCollection adalah helper untuk mengambil collection berdasarkan nama
func GetCollection(name string) *mongo.Collection {
	return DB.Collection(name)
}
