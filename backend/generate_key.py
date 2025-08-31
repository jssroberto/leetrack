# backend/generate_key.py
from cryptography.fernet import Fernet

# Generate a new key
key = Fernet.generate_key()

# The key is in bytes, so we decode it to a string to store in .env
print(key.decode())
