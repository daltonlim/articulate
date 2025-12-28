# Quick Setup Guide

## Installation Steps

1. **Install root dependencies:**
```bash
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
cd ..
```

## Running the Application

### Development Mode (Recommended)

Run both server and client together:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- React frontend on http://localhost:3000

### Production Mode

1. Build the React app:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The app will be available at http://localhost:3001

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use:
- Change the React port: Create a `.env` file in the `client` folder with `PORT=3002`
- Change the server port: Set `PORT=3002` environment variable before running

### Socket.io Connection Issues
- Make sure both server and client are running
- Check that the server URL in `client/src/App.js` matches your server port
- Ensure no firewall is blocking WebSocket connections

### Module Not Found Errors
- Delete `node_modules` folders and `package-lock.json` files
- Run `npm install` again in both root and client directories

## First Time Setup Checklist

- [ ] Node.js installed (v14+)
- [ ] npm installed
- [ ] Root dependencies installed (`npm install`)
- [ ] Client dependencies installed (`cd client && npm install`)
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can create/join a game
- [ ] Game board displays correctly

