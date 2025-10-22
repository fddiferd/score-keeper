#!/usr/bin/env python3
"""
Run script for WristbandApiClient.query_tenant_users()
Usage: python run_query_tenant_users.py --tenant-id <tenant_id> --access-token <token>
       python run_query_tenant_users.py  # Uses environment variables
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from pprint import pprint

from dotenv import load_dotenv

load_dotenv()

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from clients.wristband_client import WristbandClient
from models.wristband.user import User


async def main():
    parser = argparse.ArgumentParser(
        description='Query tenant users from Wristband API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment variables:
  TENANT_ID             Tenant ID to query users for
  ACCESS_TOKEN          Access token for authentication
  APPLICATION_VANITY_DOMAIN  Application vanity domain (required for WristbandApiClient)

Examples:
  python run_query_tenant_users.py --tenant-id tenant123 --access-token token456
  python run_query_tenant_users.py --tenant-id tenant123 --access-token token456 --start-index 20 --count 20
  TENANT_ID=tenant123 ACCESS_TOKEN=token456 python run_query_tenant_users.py
        """
    )
    
    parser.add_argument(
        '--tenant-id',
        help='Tenant ID to query users for (env: TENANT_ID)',
        default=os.getenv('TENANT_ID')
    )
    parser.add_argument(
        '--access-token',
        help='Access token for authentication (env: ACCESS_TOKEN)',
        default=os.getenv('ACCESS_TOKEN')
    )
    parser.add_argument(
        '--start-index',
        type=int,
        default=0,
        help='Start index (default: 0)'
    )
    parser.add_argument(
        '--count',
        type=int,
        default=10,
        help='Number of users per page (default: 10)'
    )
    args = parser.parse_args()
    
    # Validate required arguments)
    if not args.tenant_id and not os.getenv('TENANT_ID'):
        print("Error: --tenant-id is required (or set TENANT_ID environment variable)")
        sys.exit(1)
    
    if not args.access_token and not os.getenv('ACCESS_TOKEN'):
        print("Error: --access-token is required (or set ACCESS_TOKEN environment variable)")
        sys.exit(1)
    
    if not os.getenv('APPLICATION_VANITY_DOMAIN'):
        print("Error: APPLICATION_VANITY_DOMAIN environment variable is required")
        sys.exit(1)
    try:
        # Initialize client and make API call
        client = WristbandClient()
        print(f"Querying users for tenant_id: {args.tenant_id}")
        print(f"Start index: {args.start_index}, Count: {args.count}")
        
        result: list[User] = await client.query_tenant_users(
            args.tenant_id,
            args.access_token,
            include_roles=True
        )
        
        # Print results
        print("✅ Query completed successfully!")
        
        # Show summary
        print(f"Found {len(result)} users on this page")
        
        pprint([user.model_dump() for user in result])
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 