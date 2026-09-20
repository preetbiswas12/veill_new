with open('node_modules/.pnpm/@cometchat+chat-sdk-react-native@4.1.0/node_modules/@cometchat/chat-sdk-react-native/CometChat.js', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.read().splitlines()
for i, line in enumerate(lines):
    if 'username' in line.lower():
        # Print a snippet around the line
        start = max(0, i-3)
        end = min(len(lines), i+4)
        snippet = '\n'.join(lines[start:end])
        print(f'--- Line {i+1} ---')
        print(snippet)
        print()
