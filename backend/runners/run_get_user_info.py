#!/usr/bin/env python3
"""
Run script for WristbandApiClient.get_user_info()
Usage: python run_get_user_info.py --user-id <user_id> --access-token <token>
       python run_get_user_info.py  # Uses environment variables
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
from pprint import pprint
from dotenv import load_dotenv
from pydantic.types import T

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from clients.wristband_client import WristbandClient

load_dotenv()

async def main():
    parser = argparse.ArgumentParser(
        description='Get user information from Wristband API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment variables:
  USER_ID                User ID to fetch info for
  ACCESS_TOKEN          Access token for authentication
  APPLICATION_VANITY_DOMAIN  Application vanity domain (required for WristbandApiClient)

Examples:
  python run_get_user_info.py --user-id user123 --access-token token456
  USER_ID=user123 ACCESS_TOKEN=token456 python run_get_user_info.py
        """
    )
    
    parser.add_argument(
        '--user-id',
        help='User ID to fetch info for (env: USER_ID)',
        default=os.getenv('USER_ID')
    )
    parser.add_argument(
        '--access-token',
        help='Access token for authentication (env: ACCESS_TOKEN)',
        default=os.getenv('ACCESS_TOKEN')
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty print JSON output',
        default=True
    )
    
    args = parser.parse_args()
    
    # Validate required arguments
    if not args.user_id:
        print("Error: --user-id is required (or set USER_ID environment variable)")
        sys.exit(1)
    
    if not args.access_token:
        print("Error: --access-token is required (or set ACCESS_TOKEN environment variable)")
        sys.exit(1)
    
    if not os.getenv('APPLICATION_VANITY_DOMAIN'):
        print("Error: APPLICATION_VANITY_DOMAIN environment variable is required")
        sys.exit(1)
    
    try:
        # Initialize client and make API call
        client = WristbandClient()
        print(f"Fetching user info for user_id: {args.user_id}")
        
        user_info = await client.get_user_info(args.user_id, args.access_token, include_roles=True)
        
        # Print results
        if args.pretty:
            pprint(user_info.model_dump())
        else:
            print(user_info.model_dump())
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 