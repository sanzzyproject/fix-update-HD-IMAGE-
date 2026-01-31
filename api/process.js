const axios = require('axios');

// Headers sesuai request Anda
const headers = {
  origin: 'https://photoaid.com',
  referer: 'https://photoaid.com/en/tools/ai-image-enlarger',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'content-type': 'text/plain;charset=UTF-8'
};

async function token() {
  const t = await axios.post('https://photoaid.com/en/tools/api/tools/token', null, { headers });
  return t.data?.clientToken || t.data?.token;
}

async function upload(base64Image) {
  const tk = await token();
  
  // Hapus prefix data:image/... jika ada, karena API butuh raw base64 string
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const up = await axios.post('https://photoaid.com/en/tools/api/tools/upload',
    JSON.stringify({
      base64: cleanBase64,
      token: tk,
      reqURL: '/ai-image-enlarger/upload'
    }),
    { headers }
  );

  if (!up.data?.request_id) throw new Error('Gagal mendapatkan Request ID');
  return up.data.request_id;
}

async function result(jobId) {
  const res = await axios.post('https://photoaid.com/en/tools/api/tools/result',
    JSON.stringify({
      request_id: jobId,
      reqURL: '/ai-image-enlarger/result'
    }),
    { headers }
  );
  return res.data;
}

// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
  // CORS Handling agar bisa diakses
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const id = await upload(image);
    
    let anu;
    let attempts = 0;
    // Maksimal polling 20 kali agar tidak timeout serverless function
    const maxAttempts = 20; 

    do {
      if (attempts >= maxAttempts) throw new Error("Timeout waiting for processing");
      // Tunggu 1 detik sebelum polling lagi
      await new Promise(r => setTimeout(r, 1000));
      anu = await result(id);
      attempts++;
    } while (anu.statusAPI !== 'ready');

    // Kembalikan hasil base64 ke frontend
    return res.status(200).json({ 
      success: true, 
      result: `data:image/png;base64,${anu.result}` 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
};
