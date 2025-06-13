import express from "express";
import path from "path";
import OpenAI from "openai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(process.cwd(), "dist/client")));
}

// API routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing"
  });
});

// Chat endpoint with OpenAI
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Você é um assistente financeiro especializado em investimentos brasileiros. Responda de forma clara e educativa."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
    });

    res.json({
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Erro ao processar mensagem" });
  }
});

// Investment recommendations endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { monthlyIncome, monthlyExpenses, investmentProfile, age } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }

    const availableToInvest = monthlyIncome - monthlyExpenses;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Você é um consultor financeiro especializado no mercado brasileiro. Forneça recomendações de investimento baseadas no perfil do usuário. Responda em JSON com formato: {\"nationalInvestments\": [], \"internationalInvestments\": [], \"summary\": \"\", \"warnings\": []}"
        },
        {
          role: "user",
          content: `Preciso de recomendações de investimento para:
          - Renda mensal: R$ ${monthlyIncome}
          - Gastos mensais: R$ ${monthlyExpenses}
          - Disponível para investir: R$ ${availableToInvest}
          - Perfil: ${investmentProfile}
          - Idade: ${age} anos
          
          Forneça recomendações específicas para o mercado brasileiro.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);
    res.json(recommendations);
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Erro ao gerar recomendações" });
  }
});

// Catch-all handler for React app in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "dist/client/index.html"));
  });
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`OpenAI configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
