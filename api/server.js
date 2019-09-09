const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DreamerRouter = require('../routes/dreamers/dreamer-routes');
const InvestorRouter = require('../routes/investors/investor-routes');
const Users = require('../routes/users/user-model.js');

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json());
server.use('/api/dreamers', DreamerRouter);
server.use('/api/investors', InvestorRouter);

server.post('/register', async (req, res) => {
  const user = req.body;
  
  try {
    if (user.name && user.password && user.email) {
      const password = bcrypt.hashSync(user.password, 5);

      const hashUser = {
        ...user,
        type_id: 1,
        password: password
      }

      const addUser = await Users.addUser(hashUser);

      if (addUser) {
        const tokenUser = {
          id: addUser.id,
          name: user.name,
          email: user.email
        }

        const options = {
          expiresIn: '3h'
        }
  
        const token = jwt.sign(tokenUser, process.env.SECRET, options);

        res.status(201).json({
          message: `Thank you ${user.name}. Your user had been created.`,
          token
        });
      }
    } else {

      res.status(400).json({
        message: 'All required fields not found'
      });
    }
  } catch(err) {
    res.status(500).json({
      error: err.message
    })
  }
});

// IN PROGRESS, needs to become middleware
server.get('/login', async (req, res) => {
  const creds = req.body;
  const token = req.headers.token;
  
  try {
    if (creds.email && creds.password) {
      const verified = jwt.verify(token, process.env.SECRET);

      if (verified) {
        res.send('Logged In!');
      } else {
        res.status(403).json({
          message: 'Invalid credentials'
        })
      }
    }
  } catch(err) {
    res.status(500).json({
      error: err.message
    })
  }
});

server.get('/projects', async (req, res) => {
  try {
    const projects = await Users.getProjects();

    if (projects) {
      res.status(200).json(projects);
    }
  } catch(err) {
    res.status(500).json({
      error: err.message
    })
  }
});

server.get('/projects/:id', async (req, res) => {
  const id = req.params;

  try {
    const project = await Users.getProjById(id);

    if (project) {
      res.status(200).json(project);
    } else {
      res.status(404).json({
        message: 'The requested project was not found.'
      })
    }
  } catch(err) {
    res.status(500).json({
      error: err.message
    })
  }
});

server.get('/', (req, res) => {
  res.send('Welcome to the VR Funding API!');
});

module.exports = server;
