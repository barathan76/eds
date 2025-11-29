try:
    with open('.env', 'rb') as f:
        content = f.read()
    
    # Check for BOM
    if content.startswith(b'\xff\xfe'):
        decoded = content.decode('utf-16')
    elif content.startswith(b'\xfe\xff'):
        decoded = content.decode('utf-16-be')
    else:
        # Assume it might be utf-8 or just ascii, but if it failed before...
        # Let's try to decode as utf-16 if it looks like it
        try:
            decoded = content.decode('utf-16')
        except:
            decoded = content.decode('utf-8', errors='ignore')

    with open('.env', 'w', encoding='utf-8') as f:
        f.write(decoded.strip())
    print("Successfully converted .env to UTF-8")

except Exception as e:
    print(f"Error: {e}")
