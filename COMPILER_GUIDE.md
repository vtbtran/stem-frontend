# Hướng dẫn Xây dựng Backend Compiler cho Rotbot (ESP32)

Để nạp code không dây (OTA) hoặc nạp qua trình duyệt, chúng ta cần một **Compiler Server**. Server này có nhiệm vụ nhận code C++ từ web, dùng `arduino-cli` để biên dịch thành file `.bin`.

## 1. Kiến trúc hệ thống
*   **Web Frontend (Next.js)**: Gửi Source Code (string) -> Server.
*   **Compiler Server (Node.js + Docker)**:
    1.  Nhận code.
    2.  Lưu vào file tạm `sketch.ino`.
    3.  Chạy lệnh `arduino-cli compile ...`
    4.  Lấy file `.bin` trả về cho Web.

## 2. Chuẩn bị (Server/VPS)
Bạn nên dùng **Docker** để chạy Server này vì `arduino-cli` cần cài đặt rất nhiều thư viện phức tạp.

### File `Dockerfile`
Tạo một thư mục riêng `rotbot-compiler` và tạo file `Dockerfile`:

```dockerfile
FROM node:18-bullseye-slim

# 1. Cài đặt các công cụ cần thiết
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. Cài đặt Arduino CLI
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh

# 3. Cấu hình Arduino CLI cho ESP32
RUN arduino-cli config init
RUN arduino-cli core update-index --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
RUN arduino-cli core install esp32:esp32 --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

# 4. Setup dự án Node.js
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
```

### File `server.js` (Express Code)

```javascript
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors'); // Cho phép Web gọi vào

const app = express();
app.use(express.json());
app.use(cors());

// Cấu hình Board (Ví dụ ESP32 tiêu chuẩn)
const FQBN = "esp32:esp32:esp32";

app.post('/compile', async (req, res) => {
    const { sketchCode } = req.body;
    if (!sketchCode) return res.status(400).send("No code provided");

    // Tạo thư mục tạm (UUID để tránh trùng)
    const buildId = Date.now().toString();
    const sketchDir = path.join(__dirname, 'builds', buildId);
    await fs.mkdir(sketchDir, { recursive: true });
    
    // Arduino bắt buộc file .ino phải nằm trong thư mục cùng tên
    await fs.writeFile(path.join(sketchDir, `${buildId}.ino`), sketchCode);

    // Lệnh biên dịch
    const cmd = `arduino-cli compile --fqbn ${FQBN} --output-dir ${sketchDir} ${sketchDir}`;
    
    console.log("Compiling...", buildId);

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(stderr);
            // Dọn dẹp
            await fs.rm(sketchDir, { recursive: true, force: true });
            return res.status(500).json({ error: stderr || stdout });
        }

        // Đọc file .bin
        try {
            const binPath = path.join(sketchDir, `${buildId}.ino.bin`);
            const binData = await fs.readFile(binPath);
            
            // Gửi file bin về (dạng hex hoặc base64 để dễ xử lý ở client)
            res.json({ 
                success: true, 
                hex: binData.toString('hex') 
            });
        } catch (e) {
            res.status(500).json({ error: "Compilation success but BIN file not found" });
        } finally {
            // Dọn dẹp thư mục tạm
            await fs.rm(sketchDir, { recursive: true, force: true });
        }
    });
});

app.listen(3001, () => console.log('Compiler Server running on port 3001'));
```

### File `package.json`
```json
{
  "name": "rotbot-compiler",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
```

## 3. Cách chạy
1.  Cài Docker Desktop.
2.  Mở terminal tại thư mục chứa các file trên.
3.  Build ảnh: `docker build -t rotbot-compiler .` (Lần đầu sẽ lâu vì tải thư viện ESP32).
4.  Chạy server: `docker run -p 3001:3001 rotbot-compiler`

## 4. Tích hợp vào Web Frontend
Trong code React/Next.js khi bấm nút "Nạp code":

```javascript
const handleUpload = async (codeC) => {
    // 1. Gửi code sang Compiler Server
    const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sketchCode: codeC })
    });
    const result = await response.json();
    
    if (result.success) {
        // 2. Nhận nội dung file BIN (Hex string)
        const binData = new Uint8Array(result.hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        // 3. Gửi xuống xe qua API OTA của xe (Ví dụ 192.168.4.1)
        // Xe Rotbot cần có code OTA Web Server để nhận file này
        await uploadToRobot(binData); 
    }
};
```
