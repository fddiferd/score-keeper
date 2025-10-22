#!/usr/bin/env python3
"""
Run script for WristbandApiClient.update_user_nickname()
Usage: python run_update_user_nickname.py --user-id <user_id> --nickname <nickname> --access-token <token>
       python run_update_user_nickname.py  # Uses environment variables
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
from pprint import pprint

from dotenv import load_dotenv

from clients.wristband_client import WristbandClient
from models.wristband.user import UserProfileUpdate


load_dotenv()


async def main():
    parser = argparse.ArgumentParser(
        description='Update user nickname in Wristband API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
            Environment variables:
            USER_ID                User ID to update nickname for
            NICKNAME              New nickname to set
            ACCESS_TOKEN          Access token for authentication
            APPLICATION_VANITY_DOMAIN  Application vanity domain (required for WristbandApiClient)

            Examples:
            python run_update_user_nickname.py --user-id user123 --nickname "John Doe" --access-token token456
            USER_ID=user123 NICKNAME="John Doe" ACCESS_TOKEN=token456 python run_update_user_nickname.py
        """
    )

    parser.add_argument(
        '--user-id',
        help='User ID to update nickname for (env: USER_ID)',
        default=os.getenv('USER_ID')
    )
    parser.add_argument(
        '--nickname',
        help='New nickname to set (env: NICKNAME)',
        default=os.getenv('NICKNAME')
    )
    parser.add_argument(
        '--access-token',
        help='Access token for authentication (env: ACCESS_TOKEN)',
        default=os.getenv('ACCESS_TOKEN')
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty print JSON output'
    )
    
    args = parser.parse_args()
    
    # Debug: Print environment variables
    print(f"DEBUG - USER_ID env: {os.getenv('USER_ID')}")
    print(f"DEBUG - NICKNAME env: {os.getenv('NICKNAME')}")
    print(f"DEBUG - ACCESS_TOKEN env: {os.getenv('ACCESS_TOKEN')}")
    print(f"DEBUG - APPLICATION_VANITY_DOMAIN env: {os.getenv('APPLICATION_VANITY_DOMAIN')}")
    print(f"DEBUG - args.nickname: {args.nickname}")
    
    # Validate required arguments
    if not args.user_id:
        print("Error: --user-id is required (or set USER_ID environment variable)")
        sys.exit(1)
    
    print(args.nickname)
    if not args.nickname:
        print("Error: --nickname is required (or set NICKNAME environment variable)")
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
        print(f"Updating nickname for user_id: {args.user_id} to: {args.nickname}")
        
        user = await client.update_user(
            user_id=args.user_id,
            user_data=UserProfileUpdate(nickname=args.nickname),
            access_token=args.access_token
        )
        # Print results
        print("✅ Nickname updated successfully!")
        pprint(user.model_dump())
       
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 