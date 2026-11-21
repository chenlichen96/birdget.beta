# 使用官方輕量 Deno 鏡像
FROM denoland/deno:2.1.4

# 設定工作目錄
WORKDIR /app

# 先複製依賴設定與配置
COPY deno.json ./

# 複製前後端完整專案原始碼
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 建立資料存放目錄並預先快取程式碼
RUN mkdir -p ./backend/data && deno cache backend/server.ts

# 宣告對外 Port (Render 預設會注入 PORT 環境變數)
EXPOSE 8000

# 啟動伺服器指令
CMD ["run", "-A", "backend/server.ts"]
