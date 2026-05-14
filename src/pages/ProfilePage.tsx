import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { mockApi } from '@/api/mockApi';
import { useMutation } from '@tanstack/react-query';
import { profileSchema, passwordResetSchema } from '@/schemas';
import { PageHeader, Card, Input, Button, Textarea, Select } from '@/components/shared';
import { User, Lock, Mail, Phone, Shield, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const { t, i18n } = useTranslation();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => mockApi.updateUser(user!.id, data),
    onSuccess: (updatedUser) => {
      addNotification(t('common.save_success', 'Profile updated successfully'), 'success');
      useAuthStore.setState({ user: updatedUser });
      // Apply language change immediately if it was updated
      if (updatedUser.preferredLanguage !== i18n.language) {
        i18n.changeLanguage(updatedUser.preferredLanguage);
      }
      setErrors({});
    },
    onError: (err: any) => {
      addNotification(err.message, 'error');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => mockApi.updatePassword(user!.id, data.oldPassword, data.newPassword),
    onSuccess: () => {
      addNotification(t('common.password_success', 'Password updated successfully'), 'success');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    },
    onError: (err: any) => {
      addNotification(err.message, 'error');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSchema.safeParse(profileData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordResetSchema.safeParse(passwordData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <PageHeader 
        title={t('profile.title')} 
        subtitle={t('profile.subtitle')} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Info Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 
              user.role === 'PROVIDER' ? 'bg-green-100 text-green-700' : 
              user.role === 'CUSTOMER_SERVICE' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </div>
          </Card>

          <Card className="p-6 space-y-4 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Joined {user.joinDate}</span>
            </div>
          </Card>
        </div>

        {/* Edit Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 text-lg font-bold text-gray-900 border-b pb-4">
              <User className="w-5 h-5 text-primary-600" />
              {t('profile.personal_info')}
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label={t('profile.full_name')}
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                error={errors.name}
                placeholder="Your full name"
              />
              <Input
                label={t('common.phone')}
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                error={errors.phone}
                placeholder="555-000-0000"
              />
              <Select
                label={t('profile.preferred_language')}
                value={profileData.preferredLanguage}
                onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                error={errors.preferredLanguage}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'fr', label: 'Français' },
                ]}
              />
              <Textarea
                label={t('profile.bio')}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                error={errors.bio}
                placeholder="Tell us about yourself..."
                rows={4}
              />
              <div className="pt-2">
                <Button 
                  type="submit" 
                  loading={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Card>

          {/* Security */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 text-lg font-bold text-gray-900 border-b pb-4">
              <Lock className="w-5 h-5 text-primary-600" />
              {t('profile.security')}
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                label={t('profile.current_password')}
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                error={errors.oldPassword}
                placeholder="••••••••"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label={t('profile.new_password')}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  error={errors.newPassword}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label={t('profile.confirm_password')}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={updatePasswordMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {t('profile.reset_password')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
