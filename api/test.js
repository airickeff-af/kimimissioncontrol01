// Simple test endpoint

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ test: true, message: 'API is working', path: req.url });
}
