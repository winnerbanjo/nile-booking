import axios from 'axios';
const token = '93155a5bc54cbe235921b6d6844e05f4';
try {
  const res = await axios.post('https://send.api.mailtrap.io/api/send', {
    from: { email: 'hello@nile.ng', name: 'Nile Booking' },
    to: [{ email: 'test@example.com' }],
    subject: 'Test',
    html: 'Test'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(res.data);
} catch (e) {
  console.error(e.response?.data || e.message);
}
