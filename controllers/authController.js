const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role = "client" } = req.body;
    const allowedRoles = ["client", "collector"];

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin accounts must be created by an administrator" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Public signup only supports client or collector accounts" });
    }

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Passwords are hashed before storage so the database never stores plain text passwords.
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, phone || null, hashedPassword, role]
    );

    // Create collector profile if registering as collector
    if (role === "collector") {
      try {
        await pool.query(
          "INSERT INTO collector_profiles (user_id, is_verified) VALUES (?, ?)",
          [result.insertId, false]
        );
      } catch (profileError) {
        console.error("Failed to create collector profile", profileError);
      }
    }

    const user = { id: result.insertId, full_name, email, phone, role, status: "active" };
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "This account is not active" });
    }

    try {
      await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
    } catch (loginError) {
      console.error("Failed to update last login", loginError);
    }

    if (user.role === "collector") {
      try {
        await pool.query(
          "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
          [user.id, "collector_login", JSON.stringify({ email: user.email, role: user.role })]
        );
      } catch (logError) {
        console.error("Failed to log collector login", logError);
      }
    }

    delete user.password;
    res.json({ user, token: createToken(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, me };
