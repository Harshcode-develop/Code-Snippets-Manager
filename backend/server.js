require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");

const app = express();

// --- Security Headers ---
app.use(
  helmet({
    contentSecurityPolicy: false, // Let frontend handle CSP
    crossOriginEmbedderPolicy: false,
  }),
);

// --- Compression for all responses ---
app.use(compression());

// --- CORS (whitelist origins) ---
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- Body parsing with size limits ---
app.use(express.json({ limit: "5mb" })); // Allow large code snippets up to 5MB
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// --- Request timeout middleware ---
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// --- Supabase Admin Client (singleton, connection pooled) ---
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  },
);

// --- Helper: Create Supabase client with user's JWT ---
const createUserClient = (token) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  });
};

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased for heavy use: 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict: 20 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI rate limit exceeded. Please wait a moment." },
});

app.use("/api", apiLimiter);

// --- Input Sanitization Helper ---
const sanitizeString = (str, maxLen = 500) => {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
};

const validateUUID = (id) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
};

// --- Auth Middleware (with token caching for performance) ---
const tokenCache = new Map(); // Simple in-memory cache
const TOKEN_CACHE_TTL = 60 * 1000; // 1 minute

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided." });

  // Check cache first for performance
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
    req.user = cached.user;
    req.token = token;
    return next();
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      tokenCache.delete(token);
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    // Cache user for 1 minute
    tokenCache.set(token, { user, timestamp: Date.now() });

    // Cleanup old cache entries periodically (prevent memory leak)
    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [key, val] of tokenCache) {
        if (now - val.timestamp > TOKEN_CACHE_TTL) tokenCache.delete(key);
      }
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token verification failed." });
  }
};

// =============================================================
// AUTH ROUTES (proxied to Supabase Auth)
// =============================================================

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 254);
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    if (password.length < 6 || password.length > 128) {
      return res
        .status(400)
        .json({ message: "Password must be 6-128 characters." });
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already")) {
        return res
          .status(409)
          .json({ message: "User with this email already exists." });
      }
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 254);
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
      message: "Logged in successfully!",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/auth/google", authLimiter, async (req, res) => {
  try {
    const { access_token, id_token } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: "google",
      token: id_token || access_token,
    });

    if (error) {
      console.error("Google Auth Error:", error);
      return res.status(401).json({ message: "Google authentication failed." });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
      message: "Logged in successfully!",
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed." });
  }
});

app.post("/api/auth/refresh", authLimiter, async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "Refresh token required." });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to refresh session." });
  }
});

// =============================================================
// DATA ROUTES (optimized for large datasets)
// =============================================================

// GET all folders and snippets for current user
app.get("/api/data", authenticateToken, async (req, res) => {
  try {
    const supabase = createUserClient(req.token);
    const userId = req.user.id;

    // Parallel fetch for performance
    const [foldersResult, snippetsResult] = await Promise.all([
      supabase
        .from("folders")
        .select("id,user_id,name,parent_id,is_starred,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("snippets")
        .select(
          "id,user_id,folder_id,title,code,language,is_starred,created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (foldersResult.error) throw foldersResult.error;
    if (snippetsResult.error) throw snippetsResult.error;

    const folders = foldersResult.data || [];
    const snippets = snippetsResult.data || [];

    // Build folder tree efficiently using a Map (O(n) instead of O(n²))
    const folderMap = new Map();
    const roots = [];

    for (const folder of folders) {
      folderMap.set(folder.id, {
        ...folder,
        subfolders: [],
        snippets: [],
      });
    }

    // Assign snippets to folders
    const standaloneSnippets = [];
    for (const snippet of snippets) {
      if (snippet.folder_id && folderMap.has(snippet.folder_id)) {
        folderMap.get(snippet.folder_id).snippets.push(snippet);
      } else {
        standaloneSnippets.push(snippet);
      }
    }

    // Build tree structure
    for (const folder of folderMap.values()) {
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id).subfolders.push(folder);
      } else {
        roots.push(folder);
      }
    }

    res.json({ folders: roots, standaloneSnippets });
  } catch (error) {
    console.error("Get Data Error:", error);
    res.status(500).json({ message: "Failed to fetch data." });
  }
});

// CREATE folder
app.post("/api/folders", authenticateToken, async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 200);
    const parentId = req.body.parentId || null;
    const supabase = createUserClient(req.token);
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required." });
    }

    // Validate parentId if provided
    if (parentId && !validateUUID(parentId)) {
      return res.status(400).json({ message: "Invalid parent folder ID." });
    }

    const { data, error } = await supabase
      .from("folders")
      .insert({
        user_id: userId,
        name,
        parent_id: parentId,
        is_starred: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ message: "A folder with this name already exists." });
      }
      throw error;
    }

    res.status(201).json({ ...data, subfolders: [], snippets: [] });
  } catch (error) {
    console.error("Create Folder Error:", error);
    res.status(500).json({ message: "Failed to create folder." });
  }
});

// RENAME folder
app.put("/api/folders/:id", authenticateToken, async (req, res) => {
  try {
    const name = sanitizeString(req.body.name, 200);
    const { id } = req.params;
    const supabase = createUserClient(req.token);

    if (!name) {
      return res.status(400).json({ message: "Folder name is required." });
    }
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid folder ID." });
    }

    const { data, error } = await supabase
      .from("folders")
      .update({ name })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Folder not found." });

    res.json({ message: "Folder renamed successfully.", folder: data });
  } catch (error) {
    console.error("Rename Folder Error:", error);
    res.status(500).json({ message: "Failed to rename folder." });
  }
});

// DELETE folder (cascade handled by DB)
app.delete("/api/folders/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid folder ID." });
    }
    const supabase = createUserClient(req.token);

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.sendStatus(204);
  } catch (error) {
    console.error("Delete Folder Error:", error);
    res.status(500).json({ message: "Failed to delete folder." });
  }
});

// TOGGLE folder star
app.put("/api/folders/:id/star", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid folder ID." });
    }
    const supabase = createUserClient(req.token);

    const { data: folder, error: fetchError } = await supabase
      .from("folders")
      .select("is_starred")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!folder) return res.status(404).json({ message: "Folder not found." });

    const { error } = await supabase
      .from("folders")
      .update({ is_starred: !folder.is_starred })
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({
      message: "Folder star status updated.",
      is_starred: !folder.is_starred,
    });
  } catch (error) {
    console.error("Toggle Folder Star Error:", error);
    res.status(500).json({ message: "Failed to update folder star status." });
  }
});

// CREATE snippet (supports large code payloads)
app.post("/api/snippets", authenticateToken, async (req, res) => {
  try {
    const title = sanitizeString(req.body.title, 300);
    const code = typeof req.body.code === "string" ? req.body.code : ""; // Don't truncate code!
    const folderId = req.body.folderId || null;
    const language = sanitizeString(req.body.language || "javascript", 50);
    const supabase = createUserClient(req.token);
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: "Snippet title is required." });
    }
    if (folderId && !validateUUID(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID." });
    }

    const { data, error } = await supabase
      .from("snippets")
      .insert({
        user_id: userId,
        title,
        code,
        folder_id: folderId,
        language,
        is_starred: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ message: "A snippet with this title already exists." });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Create Snippet Error:", error);
    res.status(500).json({ message: "Failed to create snippet." });
  }
});

// UPDATE snippet
app.put("/api/snippets/:id", authenticateToken, async (req, res) => {
  try {
    const { title, code } = req.body;
    const { id } = req.params;
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid snippet ID." });
    }
    const supabase = createUserClient(req.token);

    const { data, error } = await supabase
      .from("snippets")
      .update({ title, code })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Snippet updated successfully", snippet: data });
  } catch (error) {
    console.error("Update Snippet Error:", error);
    res.status(500).json({ message: "Failed to update snippet." });
  }
});

// DELETE snippet
app.delete("/api/snippets/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid snippet ID." });
    }
    const supabase = createUserClient(req.token);

    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.sendStatus(204);
  } catch (error) {
    console.error("Delete Snippet Error:", error);
    res.status(500).json({ message: "Failed to delete snippet." });
  }
});

// TOGGLE snippet star
app.put("/api/snippets/:id/star", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) {
      return res.status(400).json({ message: "Invalid snippet ID." });
    }
    const supabase = createUserClient(req.token);

    const { data: snippet, error: fetchError } = await supabase
      .from("snippets")
      .select("is_starred")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!snippet)
      return res.status(404).json({ message: "Snippet not found." });

    const { error } = await supabase
      .from("snippets")
      .update({ is_starred: !snippet.is_starred })
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({
      message: "Snippet star status updated.",
      is_starred: !snippet.is_starred,
    });
  } catch (error) {
    console.error("Toggle Snippet Star Error:", error);
    res.status(500).json({ message: "Failed to update snippet star status." });
  }
});

// =============================================================
// AI PROXY ROUTE (Gemini API key stays server-side)
// =============================================================

app.post("/api/ai/generate", authenticateToken, aiLimiter, async (req, res) => {
  try {
    const prompt = sanitizeString(req.body.prompt, 5000);
    const context = req.body.context
      ? sanitizeString(req.body.context, 10000)
      : "";

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: "AI service is not configured." });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: context ? `${context}\n\n${prompt}` : prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API error");
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("AI did not return a valid response.");
    }

    res.json({ response: text });
  } catch (error) {
    console.error("AI Generate Error:", error);
    if (error.name === "AbortError") {
      return res.status(504).json({ message: "AI request timed out." });
    }
    res.status(500).json({ message: error.message || "AI generation failed." });
  }
});

// AI Chat endpoint with conversation history
app.post("/api/ai/chat", authenticateToken, aiLimiter, async (req, res) => {
  try {
    const prompt = sanitizeString(req.body.prompt, 5000);
    const code =
      typeof req.body.code === "string" ? req.body.code.slice(0, 50000) : ""; // Up to 50K chars of code
    const history = Array.isArray(req.body.history)
      ? req.body.history.slice(-20)
      : []; // Last 20 messages only

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: "AI service is not configured." });
    }

    const historyText = history
      .map(
        (msg) =>
          `${msg.sender === "user" ? "User" : "AI"}: ${sanitizeString(msg.text, 2000)}`,
      )
      .join("\n");

    const fullPrompt = `
You are a helpful coding assistant named Sonic.
Your goal is to help the user with their code snippet.

System Instructions:
1. You can analyze, fix bugs, optimize, refactor, add comments, explain, and modify code.
2. When providing code changes, wrap them in proper markdown code blocks with the language specified.
3. Be concise but thorough in your explanations.
4. If the user asks about improving performance or optimizing the code:
   - Analyze the code for performance bottlenecks.
   - Briefly explain the potential improvements.
   - Ask the user: "Would you like me to apply these optimizations to your code?"
5. If the user confirms after your suggestion, provide the FULL optimized code block.
6. For bug fixes, clearly explain what was wrong and provide the corrected code.
7. Always ensure code is complete and ready to use.

Code Snippet:
---
${code || "No code provided"}
---

Chat History:
${historyText}

User's Question: "${prompt}"
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API error");
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("AI did not return a valid response.");
    }

    res.json({ response: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    if (error.name === "AbortError") {
      return res.status(504).json({ message: "AI request timed out." });
    }
    res.status(500).json({ message: error.message || "AI chat failed." });
  }
});

// AI snippet action (check, correct, add_comments)
app.post("/api/ai/action", authenticateToken, aiLimiter, async (req, res) => {
  try {
    const action = sanitizeString(req.body.action, 50);
    const code =
      typeof req.body.code === "string" ? req.body.code.slice(0, 50000) : "";

    if (!code || !action) {
      return res.status(400).json({ message: "Code and action are required." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: "AI service is not configured." });
    }

    let prompt = "";
    switch (action) {
      case "check":
        prompt = `Analyze the following code snippet and identify the single line that contains the most significant error or bug. Return ONLY that single line of code, with no explanation, markdown, or any other text.\n\n${code}`;
        break;
      case "correct":
        prompt = `Correct the following code snippet. Fix any bugs or errors. Only return the raw, corrected code with no explanation or markdown formatting.\n\n${code}`;
        break;
      case "add_comments":
        prompt = `Add clear and descriptive comments to the following code snippet where necessary. Do not change the code logic. Only return the raw, updated code with no explanation or markdown formatting.\n\n${code}`;
        break;
      case "explain":
        prompt = `Explain the following code snippet in a clear, concise way. Describe what each significant part does.\n\n${code}`;
        break;
      default:
        return res.status(400).json({ message: "Invalid action." });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API error");
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("AI did not return a valid response.");
    }

    // Clean the response for code actions
    const cleanedText =
      action === "check" || action === "explain"
        ? text.trim()
        : text
            .replace(/```[\w\s]*\n/g, "")
            .replace(/```/g, "")
            .trim();

    res.json({ response: cleanedText });
  } catch (error) {
    console.error("AI Action Error:", error);
    if (error.name === "AbortError") {
      return res.status(504).json({ message: "AI request timed out." });
    }
    res.status(500).json({ message: error.message || "AI action failed." });
  }
});

// =============================================================
// HEALTH CHECK
// =============================================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal server error." });
});

// --- Server Start with graceful shutdown ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Supabase URL: ${process.env.SUPABASE_URL ? "✓ configured" : "✗ missing"}`,
  );
  console.log(
    `Gemini API Key: ${process.env.GEMINI_API_KEY ? "✓ configured" : "✗ missing"}`,
  );
});

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Export for Vercel serverless function
module.exports = app;
