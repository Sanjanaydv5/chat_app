# Chat App Testing Guide

## Prerequisites
1. MongoDB installed and running on `mongodb://localhost:27017`
2. Node.js installed (v14 or higher)
3. npm or yarn package manager

## Setup Instructions

### 1. Environment Configuration

Create `.env` file in the `server` directory:
```env
PORT=3001
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your-secret-key-here-change-in-production
NODE_ENV=development
```

Create `.env` file in the `client` directory:
```env
REACT_APP_API_URL=http://localhost:3001
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the Application

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```
Server should start on http://localhost:3001

**Terminal 2 - Start Client:**
```bash
cd client
npm start
```
Client should start on http://localhost:3000

## Testing Scenarios

### Test 1: User Registration/Login
1. Open http://localhost:3000 in your browser
2. Register or login with your credentials
3. Verify successful authentication

### Test 2: Real-Time Messaging Between Two Users
1. Open http://localhost:3000 in two different browsers (or incognito mode)
2. Login with two different user accounts
3. From User A: Select User B from the contact list
4. From User A: Send a message to User B
5. **Expected Result**: Message should appear in User B's chat window immediately
6. From User B: Reply to User A
7. **Expected Result**: User A should receive the message in real-time

### Test 3: Private Conversations
1. With three users (A, B, C) logged in separate browsers:
2. User A sends a message to User B
3. **Expected Result**: User C should NOT see this message
4. User B sends a message to User C
5. **Expected Result**: User A should NOT see this message
6. **Expected Result**: Each conversation is private between only the two participants

### Test 4: Online/Offline Status
1. Login with User A
2. Open another browser and login with User B
3. **Expected Result**: User A should see User B as "Online"
4. Close User B's browser
5. **Expected Result**: User A should see User B as "Offline" with last seen time

### Test 5: Typing Indicators
1. User A and User B in active conversation
2. User A starts typing a message
3. **Expected Result**: User B should see "Typing..." indicator
4. User A stops typing or sends the message
5. **Expected Result**: Typing indicator disappears for User B

### Test 6: Message Status (Read Receipts)
1. User A sends a message to User B (User B offline)
2. **Expected Result**: Message shows single check mark (sent)
3. User B comes online
4. **Expected Result**: Message shows double check mark gray (delivered)
5. User B opens the conversation with User A
6. **Expected Result**: Message shows double check mark blue (read)

### Test 7: Message Reactions
1. User A sends a message to User B
2. User B clicks the smile icon on the message
3. User B selects an emoji (e.g., 👍)
4. **Expected Result**: Both users see the reaction on the message
5. User B clicks the same emoji again
6. **Expected Result**: Reaction is removed

### Test 8: Message Deletion
1. User A sends a message
2. User A clicks the chevron menu on their message
3. User A selects "Delete"
4. **Expected Result**: Message is removed from both User A and User B's view

### Test 9: File/Image Sharing
1. User A clicks the paperclip icon
2. User A selects an image file
3. Preview appears, User A sends the message
4. **Expected Result**: User B receives the image in real-time

### Test 10: UI Responsiveness
1. Test on desktop (1920x1080)
2. Test on tablet (768px width)
3. Test on mobile (375px width)
4. **Expected Result**: UI adapts properly to all screen sizes

## Expected Behaviors

### Real-Time Features
✅ Messages appear instantly (< 1 second latency)
✅ Typing indicators work smoothly
✅ Online/offline status updates immediately
✅ Read receipts update in real-time
✅ Reactions appear instantly for both users

### Privacy Features
✅ Messages only visible to sender and receiver
✅ No cross-conversation message leakage
✅ Each conversation is isolated and private

### UI/UX Features
✅ WhatsApp-like appearance (green theme, message bubbles)
✅ Smooth animations and transitions
✅ Emoji picker works correctly
✅ File upload and preview work
✅ Mobile responsive design

## Troubleshooting

### Issue: Socket connection fails
**Solution**: Check that server is running and CLIENT_URL in server/.env matches client URL

### Issue: Messages not appearing in real-time
**Solution**: 
- Check browser console for Socket.IO connection errors
- Verify both users are connected (check server logs)
- Ensure Socket.IO version matches between client and server

### Issue: Cannot login
**Solution**: 
- Verify MongoDB is running
- Check server logs for connection errors
- Verify JWT_SECRET is set in .env

### Issue: Profile pictures not loading
**Solution**: Check Cloudinary configuration in server

## Performance Metrics

Expected performance:
- Message delivery: < 1 second
- Socket connection: < 2 seconds
- Page load: < 3 seconds
- Typing indicator delay: < 500ms

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors
✅ Real-time communication works flawlessly
✅ Private conversations are maintained
✅ UI looks professional and WhatsApp-like
✅ Mobile responsive
