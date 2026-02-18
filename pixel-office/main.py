"""
Isometric Pixel Office - Main Entry Point
"""
import sys
import asyncio
import argparse

def main():
    parser = argparse.ArgumentParser(description='Isometric Pixel Office')
    parser.add_argument('--web', action='store_true', help='Run as WebSocket server')
    parser.add_argument('--mock', action='store_true', help='Use mock API data')
    parser.add_argument('--width', type=int, default=1280, help='Window width')
    parser.add_argument('--height', type=int, default=720, help='Window height')
    args = parser.parse_args()
    
    if args.web:
        from web.server import run_server
        asyncio.run(run_server(mock=args.mock))
    else:
        from game.engine import GameEngine
        engine = GameEngine(width=args.width, height=args.height, mock=args.mock)
        engine.run()

if __name__ == '__main__':
    main()
