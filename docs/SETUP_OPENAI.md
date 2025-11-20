# Setting Up OpenAI API Key

## Step 1: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Give it a name like "Happiness App"
5. Copy the key (starts with `sk-...`)

⚠️ **Important:** Save this key somewhere safe! You can only see it once.

## Step 2: Add Key to Your Project

1. Open the file: `.env.local` in VS Code
2. Find this line:
   ```bash
   # LangGraph endpoint
   EXPO_PUBLIC_LANGGRAPH_URL=https://ht-respectful-upward-43-d5d062bce3565036b8c3d751d5848991.us.langgraph.app
   ```

3. Add your OpenAI key right after it:
   ```bash
   # OpenAI API Key
   EXPO_PUBLIC_OPENAI_API_KEY=sk-YOUR-KEY-HERE
   ```

4. Save the file (`Cmd + S`)

## Step 3: Restart Expo Server

In your VS Code terminal where Expo is running:
1. Press `Ctrl + C` to stop the server
2. Run: `npx expo start --clear`
3. Wait for the QR code
4. Reload the app on your iPhone

## Step 4: Test the Chat

1. Open the app on your iPhone
2. Navigate to the **Chat** tab
3. Type a message like "I feel great today!"
4. Send it
5. You should see:
   - ThinkingDock shows "Thinking..."
   - After a few seconds, alter_ego responds with a warm summary and next step

---

## Troubleshooting

**If chat doesn't work:**
- Check that the OpenAI key is valid
- Make sure you restarted the Expo server
- Check the terminal for any error messages

**If you see "Missing authentication headers":**
- The LangGraph deployment needs the OpenAI key in its environment variables
- Contact me to help deploy LangGraph with the key

---

## Cost Estimate

- GPT-4o-mini is very cheap (~$0.15 per 1M input tokens)
- Typical message: ~$0.0001 (less than a penny)
- 100 messages: ~$0.01
- Safe to test without worrying about costs!
