const axios = require('axios');
const baseURL = 'http://localhost:3000';

async function test() {
  try {
    console.log('Registering/Logging in...');
    await axios.post(`${baseURL}/auth/register`, { email: 'testapi@example.com', password: 'password', displayName: 'Test', friendCode: 'TESTAPI1' }).catch(() => {});
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email: 'testapi@example.com', password: 'password' });
    const token = loginRes.data.token;
    
    console.log('Testing Schedule Add...');
    const oneshot = await axios.post(`${baseURL}/schedule/oneshot`, {
      title: "Test",
      date: "2026-05-21",
      startTime: "09:00",
      endTime: "10:00",
      colorHex: "#3B82F6",
      tag: "default"
    }, { headers: { Authorization: `Bearer ${token}` } }).catch(e => e.response);
    console.log("Oneshot result:", oneshot.status, oneshot.data);

    console.log('Testing User Search...');
    const search = await axios.get(`${baseURL}/users/search?q=test`, { headers: { Authorization: `Bearer ${token}` } }).catch(e => e.response);
    console.log("Search with q result:", search.status, search.data);

    console.log('Testing User Search with query...');
    const search2 = await axios.get(`${baseURL}/users/search?query=test`, { headers: { Authorization: `Bearer ${token}` } }).catch(e => e.response);
    console.log("Search with query result:", search2.status, search2.data);

    console.log('Testing Get Rooms...');
    const rooms = await axios.get(`${baseURL}/rooms`, { headers: { Authorization: `Bearer ${token}` } }).catch(e => e.response);
    console.log("Get Rooms result:", rooms.status, rooms.data);

  } catch(e) {
    console.error(e.message);
  }
}
test();
