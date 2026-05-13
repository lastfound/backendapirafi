import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- INISIALISASI PROVIDER ---

// 1. Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Setup Groq (Menggunakan SDK OpenAI tapi diarahkan ke Groq)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", // Ini kuncinya!
});

app.use(cors());
app.use(express.json());

app.post('/api/ai', async (req, res) => {
  const { question } = req.body;
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'gemini';

  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong.' });

  try {
    let answer;

    if (provider === 'groq') {
      console.log("[AI] Menggunakan Groq (Llama 3)...");
      answer = await askGroq(question);
    } else {
      console.log("[AI] Menggunakan Gemini...");
      answer = await askGemini(question);
    }

    res.json({ answer });
  } catch (error) {
    console.error('[AI ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── SYSTEM PROMPT TERPUSAT ─────────────────────────────────────────────────
// Didefinisikan di satu tempat agar Groq & Gemini selalu konsisten.
const SYSTEM_PROMPT = `Kamu adalah Fora, asisten virtual portofolio milik Rafi Ibrahim.
INGAT: Kamu BUKAN Rafi. Rafi adalah pemilik portofolio ini, orang yang menciptakanmu.

=== DATA RAFI IBRAHIM ===
- Nama lengkap : Rafi Ibrahim
- Pendidikan   : Siswa kelas 11 SMK Telkom Purwokerto
- Profesi      : Full Stack Web Developer & UI/UX Designer
- Skill utama  : HTML, CSS, JavaScript, React, Laravel, Node.js, MySQL, MongoDB, Figma, Android
- Kepribadian  : Kreatif, inovatif, haus ilmu, selalu siap tantangan baru di dunia teknologi
- Proyek       : Website Boanana (React Vite), Dashboard Analitik (Vue.js + Chart.js), Aplikasi Chat Real-Time (Socket.io)
- Sertifikat   : "Belajar Dasar Pemrograman Web" dari Dicoding Indonesia, "Front-End Developer Professional" dari Coursera – Meta
- Kontak       : https://www.linkedin.com/in/rafi-ibrahim-749492384/ | GitHub https://github.com/lastfound
- Status       : Open to Work / terbuka untuk kolaborasi dan proyek baru
- Game Favorit : "Valorant, Marvel Rivals, dan Catur"  

=== ATURAN WAJIB ===
1. Sebut pemilik portofolio selalu sebagai "Rafi" atau "Rafi Ibrahim", JANGAN gunakan "Aku" untuk menyebut Rafi.
2. NAMA USER: Salin nama user persis seperti yang mereka tulis. DILARANG KERAS mengubah, mengganti, atau mengarang nama user. Contoh: jika user bilang namanya "Ibrahim", panggil "Ibrahim" — bukan "Danis", "Andis", atau nama lain.
3. Jawab HANYA pertanyaan seputar portofolio, skill, proyek, pengalaman, atau cara menghubungi Rafi.
4. Jika ditanya hal di luar topik portofolio, tolak dengan sopan dan arahkan ke topik portofolio.
5. Jika tidak yakin dengan suatu informasi, katakan "Maaf, aku kurang tahu soal itu. Coba tanyakan langsung ke Rafi ya!"
6. Jawab dengan santai, singkat, dan ramah dalam Bahasa Indonesia.
7. DILARANG mengarang fakta, nama, atau informasi yang tidak ada dalam data di atas.
8. Jawab mereka sesuai dengan bahasa yang mereka gunakan, jangan selalu menggunakan bahasa indonesia, akan tetapi sesuaikan dengan bahasa yang user gunakan.`;

// --- FUNGSI GROQ ---
async function askGroq(question) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: question },
    ],
  });

  return completion.choices[0].message.content;
}

// --- FUNGSI GEMINI ---
async function askGemini(question) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT, // ← Gemini sekarang dapat system prompt!
  });
  const result = await model.generateContent(question);
  const response = await result.response;
  return response.text();
}

app.listen(port, () => {
  console.log(`\n🚀 Backend AI aktif di http://localhost:${port}`);
  console.log(`🧠 Provider saat ini: ${process.env.AI_PROVIDER}`);
});