import React from 'react';
import ProfileInfo from '../items/settings/ProfileInfo';
import ChangePassword from '../items/settings/ChangePassword';
import Theme from '../items/settings/Theme';
import TenantSwitcher from '../items/settings/TenantSwitcher';
import WristbandSession from '../items/settings/WristbandSession';
import SignOut from '../items/settings/SignOut';
import type { SettingsConfig } from '../types';

interface SettingsSectionProps {
  config?: SettingsConfig;
}

export default function SettingsSection({ config = {} }: SettingsSectionProps) {
  const {
    profileInfo = { enabled: false },
    changePassword = { enabled: false },
    theme = { enabled: false },
    tenantSwitcher = { enabled: true }, // Default to enabled
    wristbandSession = { enabled: false },
    signOut = { enabled: false }
  } = config;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Settings
        </h1>
      </div>
      
      <div className="space-y-8">
        {tenantSwitcher.enabled && <TenantSwitcher />}
        {profileInfo.enabled && <ProfileInfo />}
        {changePassword.enabled && <ChangePassword />}
        {theme.enabled && <Theme />}
        {wristbandSession.enabled && <WristbandSession />}
        {signOut.enabled && <SignOut />}
      </div>
    </div>
  );
}
