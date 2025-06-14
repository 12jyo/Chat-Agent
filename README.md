# 💬 Claude Chat

A React-based chatbot interface powered by Anthropic's Claude API. It features persistent chat history, API key management, and a modern responsive UI. Built using Vite, Tailwind CSS, and TypeScript.

🌐 **Live Demo**  
👉 https://conversational-interface.netlify.app/

---

## ✨ Features

### 🔐 API Key Authentication
- Simple interface for saving and managing your Claude API key.
- Key stored securely in localStorage (client-side only).
- Reset/delete key at any time.

### 💬 Persistent Chat History
- Create multiple chats, auto-titled from the first message.
- Chats are saved across sessions using localStorage.
- Clear or delete chats individually or in bulk.

### ⚡ Real-time Messaging
- Auto-scrolls as new messages appear.
- Message input expands automatically with content.
- Displays loading state when Claude is generating a response.

### 🖼️ Responsive UI
- ChatGPT-style layout with two-panel design.
- Built with Tailwind CSS for responsive styling.
- Clean, minimal, and fast.

---

## 🧰 Tech Stack

- **React + TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS**
- **LocalStorage** (for persistence)
- **Claude API** (via AWS Lambda endpoint)

---

## 📁 Folder Structure
claude-chat/
├── netlify/functions/ # Serverless Claude API handler (index.mjs)
├── node_modules/
├── public/ 
├── src/ 
│ ├── App.tsx 
│ ├── main.tsx 
│ ├── index.css 
│ ├── App.css 
│ └── vite-env.d.ts 
├── .gitignore
├── index.html 
├── eslint.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
├── package-lock.json
└── README.md

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** and **npm** installed.

#### Installation

1. Clone the repo:
   git clone https://github.com/12jyo/spacex-mission-tracker.git
   cd spacex-mission-tracker

2. Install dependencies:
   npm install

3. Start the development server:
   npm run dev
   

## 🔑 Claude API Setup
This project requires an API key to call Claude:

Visit your Claude API provider and generate an API key (e.g., from a secured endpoint using AWS Lambda or reverse proxy).

On first load of the app, enter your API key.

The key is stored in localStorage and used on subsequent requests.

To reset it, use the Delete API Key button in the sidebar.
