"""Local backend runner for Windows selector event loop."""

import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

from app.main import app

if __name__ == "__main__":
    config = uvicorn.Config(app=app, host="127.0.0.1", port=4000, loop="none")
    server = uvicorn.Server(config)
    server.run()
