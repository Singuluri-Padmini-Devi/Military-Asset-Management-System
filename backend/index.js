const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const authRoutes = require("./src/routes/auth");
const purchaseRoutes = require("./src/routes/purchases");
const transferRoutes = require("./src/routes/transfers");
const assignmentRoutes = require("./src/routes/assignments");
const dashboardRoutes = require("./src/routes/dashboard");
const assetRoutes = require("./src/routes/assets");

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in backend/.env");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ message: "Military Asset Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assets", assetRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

const seedAdmin = async () => {
  const email = "admin@military.local";
  const existing = await User.findOne({ email });
  if (!existing) {
    const password = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "System Admin",
      email,
      password,
      role: "Admin",
      base: "HQ",
    });
    console.log("Default admin created: admin@military.local / Admin@123");
  }
};

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
