# 🎓 UKM Management System

Sistem Manajemen Unit Kegiatan Mahasiswa (UKM) Kampus — Tugas Akhir Backend Programming.

Aplikasi web full-stack untuk mengelola UKM kampus, termasuk keanggotaan, event, dan pengumuman.

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Project](#-menjalankan-project)
- [Struktur Project](#-struktur-project)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)

---

## ✨ Fitur

### 👤 Role Pengguna
| Role | Kemampuan |
|------|-----------|
| **Admin** | Kelola semua UKM, approve/reject pendaftaran UKM, kelola semua data |
| **Mahasiswa** | Daftar UKM, ikut event, lihat pengumuman |

### 🛠️ Fitur Utama
- 🔐 **Autentikasi** — Register, Login, Logout menggunakan JWT
- 🏫 **Manajemen UKM** — CRUD UKM dengan sistem approval
- 👥 **Keanggotaan** — Daftar & kelola anggota UKM
- 📅 **Event** — CRUD event dan registrasi peserta
- 📢 **Pengumuman** — CRUD pengumuman per UKM

---

## 🔧 Tech Stack

### Backend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| [Go](https://golang.org/) | 1.21 | Bahasa pemrograman utama |
| [Gin](https://gin-gonic.com/) | v1.9.1 | HTTP Web Framework |
| [MongoDB Driver](https://www.mongodb.com/docs/drivers/go/) | v1.13.1 | Driver resmi MongoDB |
| [golang-jwt/jwt](https://github.com/golang-jwt/jwt) | v5.2.0 | JSON Web Token (Auth) |
| [golang.org/x/crypto](https://pkg.go.dev/golang.org/x/crypto) | v0.17.0 | Enkripsi password (Bcrypt) |
| [godotenv](https://github.com/joho/godotenv) | v1.5.1 | Load file `.env` |

### Frontend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| [React](https://react.dev/) | ^18.2.0 | UI Library |
| [Vite](https://vitejs.dev/) | ^5.0.10 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | ^4.0.0 | Styling / CSS Framework |
| [React Router](https://reactrouter.com/) | ^6.21.1 | Client-side routing |
| [Axios](https://axios-http.com/) | ^1.6.4 | HTTP Client |
| [Zustand](https://zustand-demo.pmnd.rs/) | ^4.4.7 | State management |
| [React Hook Form](https://react-hook-form.com/) | ^7.49.2 | Manajemen form |
| [React Hot Toast](https://react-hot-toast.com/) | ^2.4.1 | Notifikasi |
| [React Icons](https://react-icons.github.io/react-icons/) | ^5.0.1 | Library ikon |

### Database & Deployment
| Teknologi | Kegunaan |
|-----------|----------|
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Database cloud (gratis) |
| [Railway](https://railway.app/) | Deploy backend Go |
| [Vercel](https://vercel.com/) | Deploy frontend React |

---

## ✅ Prasyarat

Pastikan semua tools berikut sudah terinstall di komputermu sebelum memulai:

### 1. Go (v1.21 atau lebih baru)
```bash
# Cek versi Go
go version

# Output yang diharapkan:
# go version go1.21.x ...
```
> 📥 Download: https://golang.org/dl/

### 2. Bun (Package Manager)
```bash
# Cek versi Bun
bun --version

# Output yang diharapkan:
# 1.x.x
```
> 📥 Install Bun:
> ```bash
> # Linux / macOS
> curl -fsSL https://bun.sh/install | bash
>
> # Windows (PowerShell)
> powershell -c "irm bun.sh/install.ps1 | iex"
> ```

### 3. Git
```bash
# Cek versi Git
git --version
```
> 📥 Download: https://git-scm.com/downloads

### 4. Akun MongoDB Atlas
> 📥 Daftar gratis di: https://www.mongodb.com/atlas
> - Buat cluster baru (pilih **Free / M0**)
> - Buat database user (username & password)
> - Whitelist IP kamu di **Network Access**
> - Copy **Connection String** untuk diisi di `.env`

---

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/username/ukm-management.git
cd ukm-management
```

### 2. Setup Backend
```bash
# Masuk ke folder backend
cd backend

# Download semua dependensi Go
go mod tidy

# Verifikasi dependensi
go mod verify

# Kembali ke root
cd ..
```

### 3. Setup Frontend
```bash
# Masuk ke folder frontend
cd frontend

# Install semua dependensi dengan Bun
bun install

# Kembali ke root
cd ..
```

---

## ⚙️ Konfigurasi Environment

### Backend `.env`
```bash
# Copy template
cp backend/.env.example backend/.env

# Edit file .env
nano backend/.env   # Linux/macOS
notepad backend\.env  # Windows
```

Isi variabel berikut di `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
DB_NAME=ukm_management
JWT_SECRET=isi_dengan_string_acak_yang_panjang_dan_aman
APP_PORT=8000
FRONTEND_URL=http://localhost:5173
```

> 💡 **Tips JWT_SECRET:** Generate string acak dengan perintah:
> ```bash
> # Linux/macOS
> openssl rand -hex 32
>
> # Atau menggunakan Go
> go run -e 'import "crypto/rand"; import "fmt"; b := make([]byte, 32); rand.Read(b); fmt.Printf("%x\n", b)'
> ```

### Frontend `.env`
```bash
# Copy template
cp frontend/.env.example frontend/.env

# Edit file .env
nano frontend/.env   # Linux/macOS
notepad frontend\.env  # Windows
```

Isi variabel berikut di `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=UKM Management
VITE_APP_VERSION=1.0.0
```

---

## ▶️ Menjalankan Project

> ⚠️ **Pastikan** file `.env` sudah diisi dengan benar sebelum menjalankan!

Buka **2 terminal** secara bersamaan:

### Terminal 1 — Backend
```bash
cd backend
go run main.go

# Output yang diharapkan:
# ✅ Terhubung ke MongoDB!
# 🚀 Server berjalan di port 8000
```

### Terminal 2 — Frontend
```bash
cd frontend
bun run dev

# Output yang diharapkan:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

Buka browser dan akses: **http://localhost:5173**

---

## 📁 Struktur Project

```
ukm-management/
├── README.md
│
├── backend/                        # Aplikasi Go
│   ├── main.go                     # Entry point
│   ├── .env                        # Environment variables (tidak di-commit)
│   ├── .env.example                # Template environment variables
│   ├── .gitignore
│   ├── go.mod                      # Dependensi Go
│   ├── Dockerfile                  # Multi-stage Docker build
│   ├── config/
│   │   └── database.go             # Koneksi MongoDB
│   ├── middleware/
│   │   ├── auth.go                 # JWT middleware
│   │   ├── cors.go                 # CORS middleware
│   │   └── role.go                 # Role-based access middleware
│   ├── models/
│   │   ├── user.go                 # Model User
│   │   ├── ukm.go                  # Model UKM
│   │   ├── ukm_member.go           # Model Anggota UKM
│   │   ├── event.go                # Model Event
│   │   ├── event_registrant.go     # Model Peserta Event
│   │   └── announcement.go        # Model Pengumuman
│   ├── handlers/                   # HTTP Handler (Controller)
│   │   ├── auth_handler.go
│   │   ├── ukm_handler.go
│   │   ├── member_handler.go
│   │   ├── event_handler.go
│   │   └── announcement_handler.go
│   ├── repositories/               # Akses database (MongoDB)
│   │   ├── user_repository.go
│   │   ├── ukm_repository.go
│   │   ├── event_repository.go
│   │   └── announcement_repository.go
│   ├── services/                   # Business logic
│   │   ├── auth_service.go
│   │   ├── ukm_service.go
│   │   ├── event_service.go
│   │   └── announcement_service.go
│   └── routes/
│       └── routes.go               # Definisi semua API endpoint
│
└── frontend/                       # Aplikasi React
    ├── index.html
    ├── package.json                # Dependensi frontend
    ├── vite.config.js              # Konfigurasi Vite + proxy API
    ├── tailwind.config.js          # Konfigurasi Tailwind CSS
    ├── postcss.config.js           # Konfigurasi PostCSS
    ├── .env                        # Environment variables (tidak di-commit)
    ├── .env.example                # Template environment variables
    ├── .gitignore
    └── src/
        ├── main.jsx                # Entry point React
        ├── App.jsx                 # Root component + routing
        ├── components/             # Komponen reusable
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── Footer.jsx
        │   ├── Card.jsx
        │   ├── Modal.jsx
        │   ├── Button.jsx
        │   └── Loading.jsx
        ├── pages/                  # Halaman aplikasi
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   └── Register.jsx
        │   ├── dashboard/
        │   │   ├── AdminDashboard.jsx
        │   │   └── UserDashboard.jsx
        │   ├── ukm/
        │   │   ├── UKMList.jsx
        │   │   └── UKMDetail.jsx
        │   ├── event/
        │   │   ├── EventList.jsx
        │   │   └── EventDetail.jsx
        │   ├── announcement/
        │   │   └── AnnouncementList.jsx
        │   └── profile/
        │       └── Profile.jsx
        ├── services/               # Fungsi pemanggilan API
        │   ├── api.js              # Axios instance + interceptor
        │   ├── authService.js
        │   ├── ukmService.js
        │   ├── eventService.js
        │   └── announcementService.js
        ├── store/                  # State management (Zustand)
        │   ├── authStore.js
        │   └── ukmStore.js
        └── utils/                  # Helper & konstanta
            ├── helpers.js
            └── constants.js
```

---

## 🌐 API Endpoints

### Format Response
```json
// Sukses
{
  "status": "success",
  "message": "pesan sukses",
  "data": {} 
}

// Error
{
  "status": "error",
  "message": "pesan error"
}
```

### Autentikasi
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Daftar akun baru | ❌ |
| POST | `/api/auth/login` | Login & dapatkan token | ❌ |
| GET | `/api/auth/me` | Info user yang login | ✅ |

### UKM
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/api/ukms` | Daftar semua UKM | ✅ |
| GET | `/api/ukms/:id` | Detail UKM | ✅ |
| POST | `/api/ukms` | Buat UKM baru | Admin |
| PUT | `/api/ukms/:id` | Update UKM | Admin |
| DELETE | `/api/ukms/:id` | Hapus UKM | Admin |
| PATCH | `/api/ukms/:id/approve` | Approve UKM | Admin |

### Keanggotaan
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/api/ukms/:id/join` | Daftar UKM | Mahasiswa |
| GET | `/api/ukms/:id/members` | Daftar anggota | ✅ |
| DELETE | `/api/ukms/:id/members/:userId` | Keluarkan anggota | Admin |

### Event
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/api/events` | Daftar semua event | ✅ |
| GET | `/api/events/:id` | Detail event | ✅ |
| POST | `/api/events` | Buat event baru | Admin |
| PUT | `/api/events/:id` | Update event | Admin |
| DELETE | `/api/events/:id` | Hapus event | Admin |
| POST | `/api/events/:id/register` | Daftar event | Mahasiswa |

### Pengumuman
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/api/announcements` | Daftar pengumuman | ✅ |
| GET | `/api/announcements/:id` | Detail pengumuman | ✅ |
| POST | `/api/announcements` | Buat pengumuman | Admin |
| PUT | `/api/announcements/:id` | Update pengumuman | Admin |
| DELETE | `/api/announcements/:id` | Hapus pengumuman | Admin |

> **Keterangan:** ✅ = Perlu login | ❌ = Publik | Admin = Hanya role admin

---

## 🗄️ MongoDB Collections

| Collection | Deskripsi |
|------------|-----------|
| `users` | Data pengguna (mahasiswa & admin) |
| `ukms` | Data Unit Kegiatan Mahasiswa |
| `ukm_members` | Data keanggotaan UKM |
| `events` | Data event/kegiatan |
| `event_registrants` | Data pendaftaran event |
| `announcements` | Data pengumuman |

---

## 🚢 Deployment

### Backend → Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy dari folder backend
cd backend
railway up
```

### Frontend → Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy dari folder frontend
cd frontend
vercel --prod
```

> ⚠️ **Jangan lupa** set environment variables di dashboard Railway dan Vercel!

---

## 👨‍💻 Pengembang

| Nama | Role |
| Kaunang, Gabriel Nehemia |
| Kandou, Nazarya Exelsis |
| Oroh, Injilio |
| Pieter, Marcovan Filippo Leanro |

---

## 📝 Lisensi

Project ini dibuat untuk keperluan **Tugas Akhir** mata kuliah Backend Programming.

---

<div align="center">
  <p>Dibuat dengan ❤️ menggunakan Go + React</p>
  <p>🎓 Tugas Akhir Backend Programming</p>
</div>
