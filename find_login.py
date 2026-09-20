with open('node_modules/.pnpm/@cometchat+chat-sdk-react-native@4.1.0/node_modules/@cometchat/chat-sdk-react-native/CometChat.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()
import re
matches = [(m.start(), m.group()) for m in re.finditer(r'login', text)]
print('Found', len(matches), 'occurrences')
for i, (start, match) in enumerate(matches[:5]):
    snippet = text[max(0, start-200):start+300]
    print('--- Match', i, '---')
    print(snippet)
