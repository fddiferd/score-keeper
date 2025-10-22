import React from 'react';
import Users from '../items/users/Users';
import type { UsersConfig } from '../types';

interface UsersSectionProps {
  config?: UsersConfig;
}

export default function UsersSection({ config = {} }: UsersSectionProps) {
  const {
    users = { enabled: false }
  } = config;

  if (!users.enabled) {
    return null;
  }

  return <Users />;
}
