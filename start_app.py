import subprocess
import os
import sys
import time
from threading import Thread

def run_backend():
    os.chdir('backend')
    subprocess.run(['uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'])

def run_frontend():
    os.chdir('frontend')
    subprocess.run(['npm', 'run', 'dev'])

def main():
    # Start backend in a separate thread
    backend_thread = Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    print("Starting backend server...")
    time.sleep(2)  # Give backend time to start
    
    # Change directory back to root before starting frontend
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("Starting frontend server...")
    run_frontend()

if __name__ == "__main__":
    main() 