import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.agent = payload; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.agent || req.agent.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}