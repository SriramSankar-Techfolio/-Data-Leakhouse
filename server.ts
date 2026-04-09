import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Data Lakehouse Engine
  const MOCK_DATA: Record<string, any[]> = {
    "sales_data": [
      { id: 1, region: "North", amount: 1200, customer_email: "alice@example.com", ssn: "123-45-6789" },
      { id: 2, region: "South", amount: 800, customer_email: "bob@example.com", ssn: "987-65-4321" },
      { id: 3, region: "North", amount: 1500, customer_email: "charlie@example.com", ssn: "456-78-9012" },
      { id: 4, region: "West", amount: 2000, customer_email: "dana@example.com", ssn: "321-09-8765" },
    ],
    "inventory": [
      { id: 101, item: "Laptop", stock: 50, warehouse: "Seattle" },
      { id: 102, item: "Monitor", stock: 120, warehouse: "Austin" },
    ]
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Execute Query with Policy Enforcement
  app.post("/api/query", async (req, res) => {
    const { query, user, policies } = req.body;
    
    // Simple parser: SELECT * FROM table
    const match = query.match(/SELECT\s+\*\s+FROM\s+(\w+)/i);
    if (!match) {
      return res.status(400).json({ error: "Only 'SELECT * FROM table' is supported in this demo." });
    }

    const tableName = match[1].toLowerCase();
    const data = MOCK_DATA[tableName];

    if (!data) {
      return res.status(404).json({ error: "Table not found." });
    }

    // 1. Table Level Access
    const tablePolicy = policies.find((p: any) => p.targetType === "table" && p.targetId === tableName);
    if (tablePolicy && tablePolicy.action === "deny") {
      return res.status(403).json({ error: "Access Denied by Policy." });
    }

    let result = [...data];

    // 2. Row Level Security (RLS)
    const rowPolicies = policies.filter((p: any) => p.targetType === "row" && p.targetId === tableName);
    rowPolicies.forEach((p: any) => {
      if (p.action === "filter") {
        // Example condition: "region == 'North'"
        const [field, op, value] = p.condition.split(" ");
        const cleanValue = value.replace(/'/g, "");
        result = result.filter(row => row[field] == cleanValue);
      }
    });

    // 3. Column Level Security (Masking)
    const colPolicies = policies.filter((p: any) => p.targetType === "column" && p.targetId === tableName);
    colPolicies.forEach((p: any) => {
      if (p.action === "mask") {
        result = result.map(row => {
          const newRow = { ...row };
          p.columns.forEach((col: string) => {
            if (newRow[col]) {
              newRow[col] = "****-****-****"; // Simple masking
            }
          });
          return newRow;
        });
      }
    });

    res.json({ data: result });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
