import express from "express";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(process.cwd(), "dist/client")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "dist/client/index.html"));
  });
}

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
