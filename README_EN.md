# GitHub Profile Views Counter

[中文版本](README.md) | [English Version](README_EN.md)

A GitHub profile views counter service that can be deployed on Vercel, using MongoDB for data storage.

## Features

- IP-based view counting (same IP within 24 hours not counted repeatedly)
- Real GitHub user verification (calls GitHub API)
- Beautiful SVG badge style
- Vercel Serverless deployment
- MongoDB data persistence
- 7-day cache mechanism to reduce API calls

## Usage

Add the following to your GitHub profile README:

```markdown
![Profile Views](https://your-domain.vercel.app/{your-github-username}/count.svg)
```

Example:

```markdown
![Profile Views](https://github-profile-views-counter.vercel.app/luoy-oss/count.svg)
```

## Deployment Steps

### 1. Prepare MongoDB Database

1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) account
2. Create a new cluster
3. Create a database user
4. Get the connection string

### 2. Deploy to Vercel

1. Fork this project to your GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Configure environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `MONGODB_DB_NAME`: Database name (optional, defaults to profile_views_counter)
   - `IP_ACCESS_WINDOW_HOURS`: IP access time window (optional, defaults to 24 hours)
5. Click Deploy

### 3. Local Development

```bash
# Install dependencies
npm install

# Copy environment variables file
cp .env.example .env

# Edit .env file, fill in your MongoDB connection information

# Start development server
npm run dev
```

Visit `http://localhost:3000/{username}/count.svg` to test

## API Documentation

### GET /{username}/count.svg

Returns profile views count SVG image

**Parameters:**
- `username`: GitHub username (path parameter)

**Response:**
- Content-Type: `image/svg+xml`
- Returns SVG format profile views badge
- Response headers include:
  - `X-Profile-Views-Count`: Current view count
  - `X-Profile-Views-Is-New`: Whether this visit is new
  - `X-Profile-Views-IP`: IP tracking status

### GET /api/count?username={username}

API interface version

**Parameters:**
- `username`: GitHub username (query parameter)

## View Counting Logic

### IP Detection Mechanism
- Same IP address visiting the same user within 24 hours counts only once
- Supports proxy environments like Vercel, Cloudflare to get real IP
- IP access records automatically cleaned up

### GitHub User Verification
- Calls GitHub API to verify if username exists
- 7-day cache mechanism to reduce API call frequency
- Prevents view counting for invalid usernames

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Vercel Serverless Functions
- **Database**: MongoDB
- **Styling**: SVG
- **API**: GitHub REST API

## License

MIT
