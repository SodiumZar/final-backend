# ==========================================
# STAGE 1: BUILDER
# Tahap ini untuk mengcompile kode Go
# ==========================================
FROM golang:1.21-alpine AS builder

# Install dependensi sistem yang dibutuhkan untuk build
# gcc dan musl-dev dibutuhkan untuk beberapa library Go
RUN apk add --no-cache gcc musl-dev

# Set working directory di dalam container
WORKDIR /app

# Copy file go.mod dan go.sum terlebih dahulu
# Ini memanfaatkan Docker layer caching
# Jika dependensi tidak berubah, layer ini tidak perlu di-rebuild
COPY go.mod go.sum ./

# Download semua dependensi Go
RUN go mod download

# Copy seluruh kode sumber ke dalam container
COPY . .

# Build aplikasi Go menjadi binary
# CGO_ENABLED=0 : matikan CGO agar binary bisa jalan di alpine
# GOOS=linux    : target OS adalah Linux
# -o main       : nama file output adalah "main"
# -ldflags="-w -s" : kurangi ukuran binary (hapus debug info)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# ==========================================
# STAGE 2: RUNNER
# Tahap ini untuk menjalankan aplikasi
# Image yang lebih kecil dan ringan
# ==========================================
FROM alpine:latest AS runner

# Install ca-certificates untuk koneksi HTTPS (MongoDB Atlas)
# dan tzdata untuk timezone
RUN apk add --no-cache ca-certificates tzdata

# Set timezone ke Asia/Denpasar (WIT)
ENV TZ=Asia/Denpasar

# Buat user non-root untuk keamanan
# Menjalankan app sebagai root adalah praktik yang buruk
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy hanya binary yang sudah di-build dari stage builder
# Ini yang membuat image akhir sangat kecil
COPY --from=builder /app/main .

# Ganti ownership file ke user non-root
RUN chown appuser:appgroup /app/main

# Gunakan user non-root
USER appuser

# Expose port yang digunakan aplikasi
EXPOSE 8080

# Perintah untuk menjalankan aplikasi
CMD ["./main"]
