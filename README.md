# 💰 FinTracker - Personal Finance Mastered

FinTracker is a comprehensive, full-stack personal finance management application designed to give you complete control over your money. Built with the MERN stack (MongoDB, Express, React, Node.js), it combines powerful tracking features with a modern, intuitive, and secure interface.

Whether you're looking to track daily expenses, manage a digital wallet, send money to friends, or save for your dream goal, FinTracker makes it effortless.

---

## 🚀 Why Use FinTracker?

Managing finances shouldn't be complicated. FinTracker solves common problems:
*   **"Where did my money go?"**: Instantly log and categorize every Rupee (₹).
*   **Social Payments**: Split bills or pay friends directly from your dashboard without external apps.
*   **Security First**: Your wallet transactions are protected by a secure 4-6 digit PIN.
*   **Visual Clarity**: See your financial health at a glance with beautiful, interactive charts.

---

## ✨ Key Features

### 📊 Smart Dashboard
*   **Real-time Overview**: Instant view of your Income, Expenses, Savings, and Net Cash Flow.
*   **Monthly Trends**: Visual indicators showing how you're doing compared to last month.
*   **Recent Activity**: Quick access to your latest transactions.

### 💳 Digital Wallet & Social Payments
*   **Secure Wallet**: Top up your internal wallet system.
*   **P2P Transfers**: Send money to friends instantly using their phone number.
*   **Friend Management**: Search, add, and manage your trusted circle of friends.
*   **PIN Protection**: All monetary transactions are secured by a custom, hashed PIN.

### 📝 Comprehensive Tracking
*   **Easy Logging**: seamless forms to add Income, Expenses, or Savings.
*   **Details Matter**: Categorize transactions, add payment modes (UPI, Card, Cash), and dates.
*   **Undo Actions**: Made a mistake? Undo recent transactions with a single click.

### 📈 Analytics & Goals
*   **Visual Reports**: Interactive pie charts and bar graphs powered by Recharts.
*   **Spending Patterns**: Identify your highest spending categories.
*   **Goal Tracking**: Set savings targets and get AI-driven insights on how to reach them based on your current saving rate.

### 🛡️ Security & Settings
*   **Authentication**: Secure JWT-based login and registration.
*   **Account Safety**: Sensitive actions are protected.
*   **Customization**: Toggle between a sleek **Dark Mode** and a crisp Light Mode.
*   **Data Control**: Full control to delete your account and data if you choose.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts, Axios.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose) with complex relationships (Users, Transactions, Friends, Wallet).
*   **Authentication**: JSON Web Tokens (JWT), Bcrypt for hashing.
*   **Deployment**: Ready for platforms like Render/Netlify.

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v14+)
*   MongoDB (Local or Atlas URI)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/murali277/fintracker.git
    cd fintracker
    ```

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    # Create a .env file and add:
    # PORT=5000
    # MONGODB_URI=your_mongodb_connection_string
    # JWT_SECRET=your_jwt_secret
    npm run dev
    ```

3.  **Setup Frontend**
    ```bash
    cd .. # back to root
    npm install
    npm run dev
    ```

4.  **Access App**
    Open `http://localhost:5173` (or your configured port) in your browser.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
