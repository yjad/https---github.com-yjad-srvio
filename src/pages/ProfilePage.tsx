import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { mockApi } from '@/api/mockApi';
import { useMutation } from '@tanstack/react-query';
import { profileSchema, passwordResetSchema } from '@/schemas';
import { PageHeader, Card, Input, Button, Textarea, Select } from '@/components/shared';
import { User, Lock, Mail, Phone, Shield, Languages, Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { localizedName } from '@/utils/localize';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const { t, i18n } = useTranslation();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    nameAr: user?.nameAr || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    bioAr: user?.bioAr || '',
    address: user?.address || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });

  const isProfileDirty = JSON.stringify(profileData) !== JSON.stringify({
    name: user?.name || '',
    nameAr: user?.nameAr || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    bioAr: user?.bioAr || '',
    address: user?.address || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => mockApi.updateUser(user!.id, data),
    onSuccess: (updatedUser) => {
      addNotification(t('common.save_success', 'Profile updated successfully'), 'success');
      useAuthStore.setState({ user: updatedUser });
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification(t('common.invalid_image', 'Please select an image file'), 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification(t('common.file_too_large', 'File size must be less than 5MB'), 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);

      const res = await mockApi.uploadAvatar(user!.id, base64);
      if (res.url) {
        addNotification(t('common.avatar_updated', 'Avatar updated successfully'), 'success');
        useAuthStore.setState({ user: { ...user!, avatar: res.url } });
      }
    } catch (err: any) {
      addNotification(err.message || t('common.upload_failed', 'Failed to upload avatar'), 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) return null;

  const displayAvatar = avatarPreview || user.avatar || null;
  const initials = user.name?.charAt(0).toUpperCase() || '?';

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
            <div className="relative w-24 h-24 mx-auto mb-4">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-full h-full bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                  {initials}
                </div>
              )}
              <label 
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg"
                title={t('profile.change_avatar', 'Change avatar')}
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                  disabled={avatarUploading}
                />
                {avatarUploading && <Upload className="w-4 h-4 animate-spin" />}
              </label>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{localizedName(user)}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 
              user.role === 'PROVIDER' ? 'bg-green-100 text-green-700' : 
              user.role === 'CUSTOMER_SERVICE' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {t(`profile.role.${user.role}` as any) || user.role}
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
              <span>{t('profile.joined')} {new Date(user.joinDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('profile.full_name_en')}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  error={errors.name}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label={t('profile.full_name_ar')}
                  value={profileData.nameAr}
                  onChange={(e) => setProfileData({ ...profileData, nameAr: e.target.value })}
                  error={errors.nameAr}
                  placeholder="جون دو"
                  dir="rtl"
                />
              </div>
              <Input
                label={t('common.phone')}
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                error={errors.phone}
                placeholder="555-000-0000"
              />
              <Input
                label={t('profile.address')}
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                error={errors.address}
                placeholder={t('profile.address')}
              />
              <Select
                label={t('profile.preferred_language')}
                value={profileData.preferredLanguage}
                onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                error={errors.preferredLanguage}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                ]}
                required
              />
              <Textarea
                label={t('profile.bio')}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                error={errors.bio}
                placeholder={t('profile.bio_placeholder')}
                rows={4}
              />
              <Textarea
                label={t('profile.bio_ar')}
                value={profileData.bioAr}
                onChange={(e) => setProfileData({ ...profileData, bioAr: e.target.value })}
                error={errors.bioAr}
                placeholder={t('profile.bio_placeholder_ar')}
                rows={4}
                dir="rtl"
              />
              <div className="pt-2">
                <Button 
                  type="submit" 
                  loading={updateProfileMutation.isPending}
                  className="w-full sm:w-auto"
                  disabled={!isProfileDirty || updateProfileMutation.isPending}
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
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label={t('profile.new_password')}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  error={errors.newPassword}
                  placeholder="••••••••"
                  required
                />
                <Input
                  type="password"
                  label={t('profile.confirm_password')}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  required
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}