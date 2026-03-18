# Hyper Run (Dev setup)

## Yêu cầu

- Node.js (hiện project đang tương thích tốt với Node 15.x trong môi trường của bạn)

## Chạy dev

```bash
npm install
npm run dev
```

Mặc định Vite sẽ chạy ở `http://127.0.0.1:5173/`.

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc thư mục

- `index.html`: chỉ còn markup + load entry `src/main.js`
- `src/main.js`: toàn bộ logic game (ES6 module) + import style
- `src/styles/main.scss`: toàn bộ CSS cũ được tách ra (nay dùng SCSS)
- `public/assets/`: thư mục chứa assets tĩnh (ảnh, audio, v.v.)

