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

## Deploy lên GitHub Pages (đúng domain/path bạn đưa)

Domain target của bạn là `https://tmnhat1993.github.io/Infinite_Run/dist/` nên project đã được cấu hình `base` là `/Infinite_Run/dist/` trong `vite.config.js`.

- Chạy build:

```bash
npm run build
```

- Upload/push toàn bộ thư mục `dist/` lên repo GitHub sao cho khi mở URL trên, file `dist/index.html` và `dist/assets/*` có thể được truy cập đúng.

## Cấu trúc thư mục

- `index.html`: chỉ còn markup + load entry `src/main.js`
- `src/main.js`: toàn bộ logic game (ES6 module) + import style
- `src/styles/main.scss`: toàn bộ CSS cũ được tách ra (nay dùng SCSS)
- `public/assets/`: thư mục chứa assets tĩnh (ảnh, audio, v.v.)

