# Deployment Guide

## Overview
This guide provides instructions for deploying the chat application to production environments.

## Prerequisites

### System Requirements
- Node.js v14 or higher
- MongoDB database (local or cloud-based like MongoDB Atlas)
- npm or yarn package manager
- Git

### Third-Party Services
- **Cloudinary** (for image/file uploads) - Get API credentials from https://cloudinary.com
- **MongoDB Atlas** (optional, for cloud database) - https://www.mongodb.com/cloud/atlas
- **Email Service** (optional, for nodemailer) - SMTP credentials

## Environment Configuration

### Server Environment Variables
Create `server/.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Client URL (your frontend URL)
CLIENT_URL=https://your-frontend-domain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat_app?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio Configuration (optional, for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

### Client Environment Variables
Create `client/.env` file:

```env
# API URL (your backend URL)
REACT_APP_API_URL=https://your-backend-domain.com
```

## Deployment Steps

### 1. Production Build

#### Build Client
```bash
cd client
npm install
npm run build
```
This creates optimized production build in `client/build/` directory.

#### Prepare Server
```bash
cd server
npm install --production
```

### 2. Database Setup

#### Option A: MongoDB Atlas (Recommended for Production)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create database user with password
4. Whitelist your server's IP address (or 0.0.0.0/0 for all IPs)
5. Get connection string and update `MONGODB_URI` in server/.env

#### Option B: Self-Hosted MongoDB
1. Install MongoDB on your server
2. Configure MongoDB for production (authentication, security)
3. Update `MONGODB_URI` with your connection string

### 3. Deployment Options

#### Option A: Deploy to Heroku

**Server Deployment:**
```bash
# In root directory
heroku login
heroku create your-app-name-api
heroku config:set NODE_ENV=production
heroku config:set PORT=3001
heroku config:set CLIENT_URL=https://your-frontend.com
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret-key
# Add other environment variables...

# Deploy
git subtree push --prefix server heroku main
```

**Client Deployment:**
Use Netlify or Vercel for frontend:
```bash
# Deploy to Netlify
npm install -g netlify-cli
cd client
netlify deploy --prod --dir=build
```

#### Option B: Deploy to DigitalOcean/AWS/VPS

**Setup Server:**
```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/Sanjanaydv5/chat_app.git
cd chat_app

# Setup environment
cp server/.env.example server/.env
nano server/.env  # Edit with your values

# Install dependencies
cd server
npm install --production

# Start with PM2
pm2 start index.js --name chat-api
pm2 save
pm2 startup
```

**Setup Nginx as Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/chat-api
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Deploy Client:**
```bash
# Build client
cd client
npm install
npm run build

# Serve with Nginx
sudo cp -r build/* /var/www/html/chat-app/
```

#### Option C: Docker Deployment

Create `Dockerfile` for server:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 3001
CMD ["node", "index.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_URL=${CLIENT_URL}
    restart: unless-stopped
```

Deploy:
```bash
docker-compose up -d
```

### 4. SSL/HTTPS Setup

Use Let's Encrypt for free SSL certificates:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5. Monitoring and Maintenance

#### PM2 Monitoring
```bash
pm2 monit
pm2 logs chat-api
pm2 restart chat-api
```

#### Database Backups
Set up automated MongoDB backups:
```bash
# Create backup script
mongodump --uri="your-mongodb-uri" --out=/backups/$(date +%Y%m%d)
```

## Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use strong JWT_SECRET (at least 32 random characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly (only allow your frontend domain)
- [ ] Set up firewall rules
- [ ] Keep dependencies updated
- [ ] Configure MongoDB authentication
- [ ] Whitelist only necessary IP addresses in MongoDB
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring and error logging

## Performance Optimization

### Server
- Enable compression middleware
- Use Redis for session storage (optional)
- Implement request rate limiting
- Optimize database queries with indexes
- Use CDN for static assets

### Client
- Minimize bundle size
- Enable lazy loading for routes
- Optimize images before upload
- Use service workers for caching (PWA)
- Enable Gzip compression

## Testing Before Deployment

1. **Environment Variables**: Verify all environment variables are set correctly
2. **Database Connection**: Test MongoDB connection
3. **Socket.IO**: Ensure WebSocket connections work through proxy/firewall
4. **CORS**: Test that frontend can communicate with backend
5. **File Uploads**: Verify Cloudinary integration works
6. **Authentication**: Test login/register functionality
7. **Real-time Features**: Test messaging, typing indicators, online status
8. **Mobile**: Test responsive design on mobile devices

## Post-Deployment Verification

1. Open the application in browser
2. Register a new user
3. Login successfully
4. Send messages (real-time should work)
5. Test file upload
6. Verify typing indicators
7. Check online/offline status
8. Test on multiple devices/browsers
9. Verify SSL certificate is working
10. Check server logs for any errors

## Troubleshooting

### Issue: Socket.IO not connecting
**Solution**: 
- Check CORS configuration in server
- Verify CLIENT_URL matches actual frontend URL
- Ensure WebSocket protocol is allowed through firewall/proxy

### Issue: Database connection fails
**Solution**:
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### Issue: File uploads not working
**Solution**:
- Verify Cloudinary credentials are correct
- Check file size limits
- Ensure upload folder has write permissions

### Issue: JWT authentication fails
**Solution**:
- Verify JWT_SECRET is set and same across restarts
- Check token expiration settings
- Clear browser cookies and try again

## Maintenance

### Regular Tasks
- **Daily**: Check server logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Database backup verification, security audit

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd server && npm install
cd ../client && npm install && npm run build

# Restart services
pm2 restart chat-api
```

## Support

For issues or questions:
- Check the [TESTING_GUIDE.md](TESTING_GUIDE.md) for common issues
- Review [FIX_REPORT.md](FIX_REPORT.md) for technical details
- See [QUICKSTART.md](QUICKSTART.md) for development setup

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database set up and secured
- [ ] SSL/HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Testing completed (see TESTING_GUIDE.md)
- [ ] Documentation reviewed
- [ ] Team trained on deployment process

---

**Ready for Production Deployment!** 🚀
