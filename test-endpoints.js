const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('Testing Financial Advisor API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);

    // Test news endpoint
    console.log('\n2. Testing news endpoint...');
    const news = await axios.get(`${BASE_URL}/api/news?limit=2`);
    console.log('✅ News (first 2):', news.data.data?.slice(0, 2) || 'No data');

    // Test crypto price endpoint
    console.log('\n3. Testing crypto price endpoint...');
    const crypto = await axios.get(`${BASE_URL}/api/market/crypto/bitcoin`);
    console.log('✅ Bitcoin price:', crypto.data);

    console.log('\n🎉 All endpoints are working!');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testEndpoints();