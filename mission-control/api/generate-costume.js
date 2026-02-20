/**
 * Costume Generation API
 * Serverless function for AI costume texture generation
 * Deploy to: /api/generate-costume.js
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, agentId, holiday, size = 32 } = req.body;

  if (!prompt || !agentId || !holiday) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check for API key
    const apiKey = process.env.REPLICATE_API_TOKEN || process.env.STABILITY_API_KEY;
    
    if (!apiKey) {
      // Return placeholder if no API key configured
      return res.status(200).json({
        textureUrl: generatePlaceholderUrl(agentId, holiday),
        source: 'placeholder',
        message: 'AI generation not configured, using placeholder'
      });
    }

    // Try Replicate API first
    if (process.env.REPLICATE_API_TOKEN) {
      const textureUrl = await generateWithReplicate(prompt, size);
      return res.status(200).json({
        textureUrl,
        source: 'replicate',
        cached: false
      });
    }

    // Fallback to Stability AI
    if (process.env.STABILITY_API_KEY) {
      const textureUrl = await generateWithStability(prompt, size);
      return res.status(200).json({
        textureUrl,
        source: 'stability',
        cached: false
      });
    }

  } catch (error) {
    console.error('Costume generation error:', error);
    
    // Return placeholder on error
    return res.status(200).json({
      textureUrl: generatePlaceholderUrl(agentId, holiday),
      source: 'placeholder',
      error: error.message
    });
  }
}

/**
 * Generate texture using Replicate API
 */
async function generateWithReplicate(prompt, size) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // Stable Diffusion
      input: {
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, extra limbs, photorealistic, 3d render",
        width: size,
        height: size,
        num_outputs: 1,
        num_inference_steps: 20,
        guidance_scale: 7.5
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status}`);
  }

  const prediction = await response.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pollResponse = await fetch(result.urls.get, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });
    
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('Generation failed');
  }

  return result.output[0];
}

/**
 * Generate texture using Stability AI API
 */
async function generateWithStability(prompt, size) {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('negative_prompt', 'blurry, low quality, distorted, extra limbs, photorealistic, 3d render');
  formData.append('width', size.toString());
  formData.append('height', size.toString());
  formData.append('samples', '1');
  formData.append('steps', '20');
  formData.append('cfg_scale', '7');

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Accept': 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Stability API error: ${response.status}`);
  }

  const result = await response.json();
  
  // Return base64 image as data URL
  const base64 = result.artifacts[0].base64;
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate placeholder URL (colored pattern)
 */
function generatePlaceholderUrl(agentId, holiday) {
  // Return URL to client-side generated placeholder
  return `/api/costume-placeholder?agent=${agentId}&holiday=${holiday}`;
}
