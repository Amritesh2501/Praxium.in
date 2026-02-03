# MongoDB Setup Guide

I have updated your backend to use MongoDB effectively. Here is how to get the database running.

## Option A: Local MongoDB (Recommended)
1. **Download**: Visit [MongoDB Community Server](https://www.mongodb.com/try/download/community) and download the Windows MSI installer.
2. **Install**: Run the installer. 
   - **Crucial Step**: Ensure **"Install MongoDB as a Service"** is checked.
   - Recommended: Install **MongoDB Compass** (the GUI) when prompted.
3. **Connection**: I have pre-configured your `.env` file with the default local URI:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/praxium
   ```

## Option B: MongoDB Atlas (Cloud)
If you prefer a cloud database:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a Cluster (Free Tier).
3. Click **Connect** -> **Connect your application**.
4. Copy the connection string and update your `.env` file:
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@cluster...
   ```

## How It Works Now
- **Old Way**: Data was saved to `server/data/*.json`.
- **New Way**: Data is saved to MongoDB collections (`users`, `courses`, `enrollments`, etc.).
- **Compatibility**: The API endpoints (`/api/data/:key`) remain the same, so your Frontend **does not need any changes**.

### Importing Old Data
Your existing JSON files (`users.json`, etc.) are safe but are **not** automatically loaded into MongoDB.
If you want to migrate existing data:
1. Open **MongoDB Compass**.
2. Connect to `mongodb://127.0.0.1:27017`.
3. Create a database named `praxium`.
4. Create collections: `users`, `courses`, `enrollments`.
5. Use the **Import Data** button in Compass to select your `server/data/*.json` files and import them.
