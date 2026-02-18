// API endpoint for deployment information
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const deployments = {
      timestamp: new Date().toISOString(),
      count: 47,
      latest: {
        id: 'dep_' + Date.now(),
        url: 'https://dashboard-ten-sand-20.vercel.app',
        created: '2026-02-18T13:00:00Z',
        status: 'ready',
        target: 'production'
      },
      history: [
        {
          id: 'dep_001',
          created: '2026-02-18T13:00:00Z',
          status: 'ready',
          target: 'production',
          commit: 'e50ae964'
        },
        {
          id: 'dep_002', 
          created: '2026-02-18T12:00:00Z',
          status: 'ready',
          target: 'production',
          commit: '81e958d6'
        },
        {
          id: 'dep_003',
          created: '2026-02-17T10:00:00Z',
          status: 'ready',
          target: 'production',
          commit: 'abc12345'
        }
      ],
      meta: {
        project: 'dashboard',
        platform: 'vercel',
        region: 'sin1'
      }
    };

    return res.status(200).json(deployments);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch deployments',
      message: error.message
    });
  }
};
