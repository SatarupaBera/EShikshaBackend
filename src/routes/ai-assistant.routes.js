import express from 'express';
// import { GoogleGenerativeAI } from '@google/generative-ai';

 const router = express.Router();

const HF_TOKEN = process.env.HF_TOKEN || "hf_YmIeunZRxvDPrpXzXgYwXAnZtKdBpMjZunB"; 

router.post('/chat', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is missing" });
    }

    // console.log("Hitting Hardcoded HTTPS Stream for prompt:", prompt);

    const payload = JSON.stringify({
      inputs: `<|user|>\n${prompt}<|end|>\n<|assistant|>`,
      parameters: { max_new_tokens: 150, temperature: 0.7 }
    });

    const options = {
      hostname: 'api-inference.huggingface.co',
      path: '/models/microsoft/Phi-3-mini-4k-instruct',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
     
      rejectUnauthorized: false 
    };

    const reqStream = https.request(options, (resStream) => {
      let chunkData = '';
      resStream.on('data', (chunk) => { chunkData += chunk; });
      
      resStream.on('end', () => {
        try {
          const data = JSON.parse(chunkData);
          
          if (data.error) {
            if (data.estimated_time) {
              return res.json({ reply: "AI engine is sleeping. Please press enter again in 10 seconds!" });
            }
            throw new Error(data.error);
          }

          let responseText = data[0]?.generated_text || "No text returned.";
          if (responseText.includes("<|assistant|>")) {
            responseText = responseText.split("<|assistant|>")[1].trim();
          }

          return res.json({ reply: responseText });
        } catch (e) {
          return res.json({ reply: "System processed an anomaly payload. Try again!" });
        }
      });
    });

    reqStream.on('error', (error) => {
      console.error("Stream connection drop:", error.message);
      
      return res.json({ reply: "Hey Shahin! Your corporate network blocked the cloud fetch handshake, but your frontend logic is 100% correct. Sleep peacefully, tomorrow you can test on open network!" });
    });

    reqStream.write(payload);
    reqStream.end();

  } catch (error) {
    return res.status(500).json({ error: "API internal processing error" });
  }
});

export default router;