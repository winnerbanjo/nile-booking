import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/oyekunle/Documents/nilebooking/server/.env' });

async function testMailtrap() {
  const token = process.env.MAILTRAP_TOKEN;
  console.log('Token exists:', !!token);
  
  try {
    const payload = {
      to: [{ email: 'nilebookings@nile.ng', name: 'Test User' }],
      from: { email: process.env.MAILTRAP_FROM_EMAIL || 'hello@nile.ng', name: 'Nile Booking' },
      subject: 'Test Email',
      html: '<p>Test</p>'
    };
    
    const response = await axios.post('https://send.api.mailtrap.io/api/send', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
testMailtrap();
