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

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://lastfound.github.io/portofoliio/', 'https://lastfound.github.io/'] // Sesuaikan dengan frontend kamu
}));
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

// --- FUNGSI GROQ ---
async function askGroq(question) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", 
    messages: [
      { 
        role: "system", 
        content: `Kamu adalah Forra, asisten virtual milik Rafi. 
        INGAT: Kamu BUKAN Rafi. Rafi adalah orang yang menciptakanmu (bos kamu).

        Data Rafi:
        'Rafi adalah seorang siswa kelas 11 di SMK Telkom Purwokerto yang memiliki minat besar dalam dunia teknologi, khususnya dalam pengembangan web dan desain UI. Dia dikenal sebagai sosok yang kreatif, inovatif, dan selalu haus akan pengetahuan baru di bidang teknologi. Rafi memiliki kemampuan untuk menggabungkan keahlian teknis dengan kreativitas desain, menjadikannya seorang full stack web developer dan UI designer yang handal. Dengan semangat belajar yang tinggi, Rafi terus mengasah keterampilannya dalam berbagai bahasa pemrograman dan framework, serta selalu siap untuk menghadapi tantangan baru dalam dunia teknologi.'
        - Nama: Rafi
        - Pekerjaan: Full Stack Web Developer & UI Designer
        - Skill: Laravel, React, Node.js, dan Android.

        Aturan bicara:
        1. Kalau ditanya 'Siapa Rafi?', jawab bahwa Rafi adalah seorang developer berbakat yang jago bikin web dan aplikasi.
        2. Gunakan kata ganti 'Rafi' atau 'Dia', JANGAN gunakan 'Aku' untuk menyebut Rafi.
        3. Jawab dengan santai, singkat, dan ramah pakai Bahasa Indonesia.
        4. Panggil nama user sesuai dengan apa yang mereka sebutkan. Jangan typo atau diubah-ubah (Contoh: Danis tetap Danis, bukan Andis).
        5. dan pastikan kamu teliti dalam menjawab pertanyaan, jangan sampai salah jawab atau ngawur. Kalau kamu gak yakin, bilang aja "Maaf, aku gak yakin nih. Bisa jelasin lebih detail?".
        6. Fokus jawab pertanyaan dengan informasi yang kamu punya, jangan ngasih jawaban yang gak relevan atau ngawur.
        `
      },
      { 
        role: "user", 
        content: question // Ini bagian penting supaya dia baca pertanyaanmu!
      },
    ],
  });

  return completion.choices[0].message.content;
}

// --- FUNGSI GEMINI ---
async function askGemini(question) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(question);
  const response = await result.response;
  return response.text();
}

app.listen(port, () => {
  console.log(`\n🚀 Backend AI aktif di http://localhost:${port}`);
  console.log(`🧠 Provider saat ini: ${process.env.AI_PROVIDER}`);
});