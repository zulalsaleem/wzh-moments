import { useState } from 'react';
import { User, Lock, Camera } from 'lucide-react';
import UpdateProfileForm from './UpdateProfileForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import AvatarUpload from './AvatarUpload';
import { useAuth } from '../../hooks/useAuth';

const SettingsTab = () => {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'photo', label: 'Profile Photo', icon: Camera },
  ];

  return (
    <div className="card max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Account Settings</h2>
      <p className="text-gray-500 text-sm mb-6">Manage your profile and security settings</p>

      {/* Section Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeSection === section.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 mb-6" />

      {activeSection === 'profile' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Personal Information</h3>
          <p className="text-sm text-gray-500 mb-5">Update your name, phone number, and bio</p>
          <UpdateProfileForm />
        </div>
      )}

      {activeSection === 'password' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Change Password</h3>
          <p className="text-sm text-gray-500 mb-5">
            Keep your account secure with a strong password. You will be logged out after changing.
          </p>
          <UpdatePasswordForm />
        </div>
      )}

      {activeSection === 'photo' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Profile Photo</h3>
          <p className="text-sm text-gray-500 mb-5">Upload a photo to personalize your account</p>
          <div className="flex items-center gap-6">
            <AvatarUpload
              currentImage={user?.profileImage}
              name={user?.name}
              size="lg"
              onUploadSuccess={(data) => updateUser({ profileImage: data.profileImage })}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-3">Click the camera icon to upload</p>
              <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
