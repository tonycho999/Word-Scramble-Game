/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // 이 경로가 정확해야 스타일이 생성됩니다.
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
