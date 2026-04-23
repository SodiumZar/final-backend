// PostCSS adalah alat untuk memproses CSS dengan berbagai plugin
// File ini dibutuhkan agar Tailwind CSS bisa bekerja dengan Vite
export default {
    plugins: {
        "@tailwindcss/postcss": {},
        // Plugin Autoprefixer - otomatis tambahkan prefix CSS
        // untuk kompatibilitas lintas browser (-webkit-, -moz-, dll)
        autoprefixer: {},
    },
}