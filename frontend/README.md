# ⛓️ Blockchain Voting DApp

> 🇻🇳 **Tiếng Việt** | 🇬🇧 [English](#-english-version)

Ứng dụng bỏ phiếu bầu cử phi tập trung trên nền tảng Ethereum Blockchain — minh bạch, bất biến, không thể gian lận.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)](contracts/Voting.sol)
[![Hardhat](https://img.shields.io/badge/Hardhat-Tests%2016%2F16-yellow?logo=hardhat)](test/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://voting-dapp-silk.vercel.app)
[![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-purple)](https://sepolia.etherscan.io/address/0xF74f589db0A5f832204Ee45b1AE5436D030D96a2)

---

## 🔗 Links

| | URL |
|--|--|
| 🌐 **User Site** | https://voting-dapp-silk.vercel.app |
| ⚙️ **Admin Panel** | https://voting-dapp-adir.vercel.app |
| 📋 **Smart Contract** | [0xF74f...a2 trên Sepolia Etherscan](https://sepolia.etherscan.io/address/0xF74f589db0A5f832204Ee45b1AE5436D030D96a2) |
| 💻 **GitHub** | https://github.com/PhamVuCoder/Voting-dapp |

---

## ✨ Tính năng

### 👥 Người dùng
- 🦊 Kết nối ví MetaMask, tự động chuyển sang Sepolia
- 🗳 Bỏ phiếu cho ứng viên — mỗi ví chỉ được 1 phiếu
- ⚡ Cập nhật realtime qua Alchemy WebSocket
- 👤 Hiển thị ENS (`.eth`) thay địa chỉ ví
- ⏰ Đồng hồ đếm ngược thời gian bầu cử
- 🔔 Toast notification đẹp cho mọi hành động
- 🔍 Link Etherscan sau khi vote thành công

### ⚙️ Admin
- ➕ Thêm ứng viên (trước khi bầu cử bắt đầu)
- 🚫 Ẩn / hiện ứng viên (Soft Delete)
- 🚀 Bắt đầu bầu cử với thời gian tuỳ chọn
- 🛑 Kết thúc bầu cử sớm
- 📊 Dashboard thống kê realtime
- 📜 Lịch sử toàn bộ transactions on-chain

---

## 🛠 Tech Stack

### Smart Contract
| Công nghệ | Mô tả |
|-----------|-------|
| Solidity `^0.8.24` | Ngôn ngữ viết smart contract |
| Hardhat | Compile, test, deploy |
| Chai + Ethers.js | Unit testing (16/16 passed) |
| Sepolia Testnet | Mạng blockchain test |

### Frontend
| Công nghệ | Mô tả |
|-----------|-------|
| React 18 + Vite | UI framework |
| ethers.js v6 | Kết nối blockchain |
| MetaMask | Ký transaction |
| Alchemy RPC | Đọc dữ liệu từ chain |
| Alchemy WebSocket | Lắng nghe events realtime |

### DevOps
| Công nghệ | Mô tả |
|-----------|-------|
| GitHub | Version control |
| Vercel | Deploy frontend (CI/CD tự động) |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────┐         ┌─────────────────┐
│   User Site     │         │   Admin Panel   │
│ voting-dapp-    │         │ voting-dapp-    │
│ silk.vercel.app │         │ adir.vercel.app │
└────────┬────────┘         └────────┬────────┘
         │  ethers.js                │  ethers.js
         │  (Read/Write)             │  (Read/Write)
         ▼                           ▼
┌─────────────────────────────────────────────┐
│         Smart Contract (Solidity)           │
│     0xF74f589db0A5f832204Ee45b1AE5436D030D96a2      │
│              Sepolia Testnet                │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    Alchemy RPC          Alchemy WSS
   (HTTP - Read)     (WebSocket - Events)
```

---

## 📦 Cài đặt & Chạy local

### Yêu cầu
- Node.js >= 18
- MetaMask extension
- Sepolia ETH (lấy free tại https://sepoliafaucet.com)

### 1. Clone repository
```bash
git clone https://github.com/PhamVuCoder/Voting-dapp.git
cd Voting-dapp
```

### 2. Cài đặt dependencies
```bash
# Root (Hardhat)
npm install

# Frontend
cd frontend && npm install

# Admin
cd ../admin && npm install
```

### 3. Cấu hình environment
```bash
# Tạo file .env ở thư mục gốc
cp .env.example .env
```

Điền vào `.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### 4. Compile & Test
```bash
npx hardhat compile
npx hardhat test
# ✔ 16/16 tests passing
```

### 5. Deploy contract
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 6. Chạy frontend
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### 7. Chạy admin
```bash
cd admin
npm run dev
# → http://localhost:5174
```

---

## 🔐 Smart Contract

### Functions

| Function | Access | Mô tả |
|----------|--------|-------|
| `vote(uint id)` | Public | Bỏ phiếu cho ứng viên |
| `addCandidate(string name)` | Owner | Thêm ứng viên |
| `hideCandidate(uint id)` | Owner | Ẩn ứng viên |
| `showCandidate(uint id)` | Owner | Hiện ứng viên |
| `startElection(uint seconds)` | Owner | Bắt đầu bầu cử |
| `endElection()` | Owner | Kết thúc sớm |
| `getAllCandidates()` | View | Lấy tất cả ứng viên |
| `getActiveCandidates()` | View | Lấy ứng viên đang hiển thị |
| `getElectionInfo()` | View | Trạng thái bầu cử |

### Events

| Event | Khi nào |
|-------|---------|
| `Voted(voter, candidateId)` | Có người vote |
| `CandidateAdded(id, name)` | Thêm ứng viên |
| `CandidateHidden(id)` | Ẩn ứng viên |
| `CandidateShown(id)` | Hiện ứng viên |
| `ElectionStarted(deadline)` | Bắt đầu bầu cử |
| `ElectionEnded()` | Kết thúc bầu cử |

---

## 🧪 Tests

```bash
npx hardhat test
```

```
Voting v3 — Soft Delete
  ✔ 1.  Owner đúng
  ✔ 2.  Mặc định chưa mở bầu cử
  ✔ 3.  Có 3 ứng viên mặc định, tất cả isHidden = false
  ✔ 4.  Admin ẩn ứng viên thành công
  ✔ 5.  Người khác không ẩn được ứng viên
  ✔ 6.  Không ẩn ứng viên đã ẩn rồi
  ✔ 7.  Admin hiện lại ứng viên thành công
  ✔ 8.  Không hiện ứng viên đang hiển thị rồi
  ✔ 9.  getActiveCandidates chỉ trả về ứng viên chưa ẩn
  ✔ 10. getAllCandidates trả về TẤT CẢ kể cả đã ẩn
  ✔ 11. Không vote được ứng viên đã ẩn
  ✔ 12. Vote bình thường với ứng viên chưa ẩn
  ✔ 13. Start bầu cử thành công
  ✔ 14. Không vote 2 lần
  ✔ 15. Admin kết thúc sớm
  ✔ 16. getElectionInfo totalVotes không tính ứng viên ẩn

16 passing (936ms)
```

---

## 📁 Cấu trúc project

```
Voting-dapp/
├── contracts/
│   └── Voting.sol          # Smart contract chính
├── scripts/
│   └── deploy.js           # Script deploy
├── test/
│   └── Voting.test.js      # Unit tests
├── hardhat.config.js
├── frontend/               # User site
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── utils/
│           └── contract.js
└── admin/                  # Admin panel
    └── src/
        ├── App.jsx
        ├── App.css
        └── utils/
            └── contract.js
```

---

## 👨‍💻 Tác giả

**Phạm Vũ**
- GitHub: [@PhamVuCoder](https://github.com/PhamVuCoder)

---

---

# 🇬🇧 English Version

A decentralized voting application built on Ethereum Blockchain — transparent, immutable, and tamper-proof.

---

## ✨ Features

### Users
- 🦊 MetaMask wallet connection with auto Sepolia switch
- 🗳 Vote for candidates — one vote per wallet address
- ⚡ Real-time updates via Alchemy WebSocket
- 👤 ENS name resolution (`.eth` display)
- ⏰ Live countdown timer
- 🔔 Toast notifications for all actions
- 🔍 Etherscan link after successful vote

### Admin
- ➕ Add candidates (before election starts)
- 🚫 Hide / show candidates (Soft Delete)
- 🚀 Start election with custom duration
- 🛑 End election early
- 📊 Real-time statistics dashboard
- 📜 Full on-chain transaction history

---

## 📦 Installation

```bash
# Clone
git clone https://github.com/PhamVuCoder/Voting-dapp.git
cd Voting-dapp

# Install dependencies
npm install
cd frontend && npm install
cd ../admin && npm install

# Configure .env
SEPOLIA_RPC_URL=...
PRIVATE_KEY=...

# Compile & Test
npx hardhat compile
npx hardhat test

# Deploy
npx hardhat run scripts/deploy.js --network sepolia

# Run frontend
cd frontend && npm run dev
```

---

## 📄 License

MIT © 2026 Phạm Vũ