const axios = require('axios');

const BASE_URL = "http://localhost:3000/api";

const adminAccount = { username: "admin", password: "password" };
const aliceAccount = { username: "alice", password: "password" };

module.exports = {
  loginAsAdmin: async () => {
    const loginResponse = await axios.post(`${BASE_URL}/auth`, adminAccount);
    cookie = loginResponse.headers["set-cookie"][0];

    return axios.create({
        headers: { Cookie: cookie },
        withCredentials: true,
        baseURL: BASE_URL
    })
  },
  login: async(username, password) => {
    const loginResponse = await axios.post(`${BASE_URL}/auth`, { username: username, password: password });
    cookie = loginResponse.headers["set-cookie"][0];

    return axios.create({
        headers: { Cookie: cookie },
        withCredentials: true,
        baseURL: BASE_URL
    })
  }
}