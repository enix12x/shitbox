const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const commentJson = require('comment-json');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let config;
try {
  const configData = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  config = commentJson.parse(configData);
} catch (error) {
  console.error('Error loading config.json:', error);
  process.exit(1);
}

app.get('/', (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    html = html.replace(/\{\{BRANDING\}\}/g, config.branding);
    html = html.replace(/\{\{COMPUTER_OPTIONS\}\}/g, 
      config.computers.map(comp => `<option value="${comp.ip}">${comp.name}</option>`).join('')
    );
    
    res.send(html);
  } catch (error) {
    console.error('Error loading index.html:', error);
    res.status(500).send('Error loading page');
  }
});

app.post('/send', (req, res) => {
  const { computer, message } = req.body;
  
  if (!computer || !message) {
    return res.status(400).send('Missing computer or message');
  }
  
  const computerInfo = config.computers.find(c => c.ip === computer);
  const computerName = computerInfo ? computerInfo.name : computer;
  
  const command = `msg * /SERVER:${computer} ${message}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    
    console.log(`Message sent to ${computerName} (${computer}): ${message}`);
    res.send(`Message sent to ${computerName}!<br><a href="/">Go back</a>`);
  });
});

app.listen(PORT, () => {
  console.log(`shitbox running at http://localhost:${PORT}`);
});

