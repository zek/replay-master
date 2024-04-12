const readline = require('readline');
const SteamUser = require('steam-user');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create a new SteamUser instance
const client = new SteamUser();

// Function to log in to Steam
function loginToSteam(username, password) {
  client.logOn({
    accountName: username,
    password
  });
}

// Ask for username and password
rl.question('Enter your Steam username: ', (username) => {
  rl.question('Enter your Steam password: ', (password) => {
    loginToSteam(username, password);
    rl.close();
  });
});

// Event listener for successful login
client.on('loggedOn', () => {
  console.log('Logged in to Steam successfully.');
});

// Event listener for login failure
client.on('error', (err) => {
  console.error('Error logging in:', err);
});

client.on('refreshToken', (token) => {
  console.error('refreshToken:', token);
});
