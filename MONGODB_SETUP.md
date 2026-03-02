# MongoDB Installation Guide

## Installation Steps

### 1. Add the MongoDB Tap
```bash
brew tap mongodb/brew
```

### 2. Install MongoDB Community Edition 7.0
```bash
brew install mongodb-community@7.0
```

### 3. Start MongoDB Service
```bash
brew services start mongodb-community@7.0
```

## Troubleshooting

### If you encounter Homebrew lock errors:

**Option 1: Wait for the current process to finish**
- Another Homebrew process is running
- Wait a few minutes and try again

**Option 2: Fix permissions (if needed)**
```bash
sudo chown -R $(whoami) /opt/homebrew/var/homebrew
```

**Option 3: Kill the existing Homebrew process**
```bash
# Find the process
ps aux | grep brew

# Kill it (replace PID with actual process ID)
kill -9 <PID>
```

### Verify MongoDB Installation

After installation, verify MongoDB is running:

```bash
# Check if MongoDB service is running
brew services list | grep mongodb

# Or check MongoDB status directly
mongosh --eval "db.version()"
```

## MongoDB Connection

Once MongoDB is installed and running, update your `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/nile-booking
```

Or if you prefer a connection string format:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/nile-booking
```

## Default MongoDB Settings

- **Port**: 27017
- **Data Directory**: `/opt/homebrew/var/mongodb`
- **Log Directory**: `/opt/homebrew/var/log/mongodb`
- **Config File**: `/opt/homebrew/etc/mongod.conf`

## Useful MongoDB Commands

```bash
# Start MongoDB service
brew services start mongodb-community@7.0

# Stop MongoDB service
brew services stop mongodb-community@7.0

# Restart MongoDB service
brew services restart mongodb-community@7.0

# Connect to MongoDB shell
mongosh

# Connect to specific database
mongosh nile-booking
```

## Next Steps

After MongoDB is installed and running:

1. **Update server/.env** with the MongoDB connection string
2. **Start the application**:
   ```bash
   npm run dev
   ```
3. **Verify connection** - The server should connect to MongoDB on startup

## Notes

- MongoDB will start automatically on system boot if you use `brew services start`
- The default installation doesn't require authentication for local connections
- For production, you should enable authentication and configure security settings
