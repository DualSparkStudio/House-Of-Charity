import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import type { Donor, NGO } from '../types';

type ProfileFormValues = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  website?: string;
  description?: string;
  works_done?: string;
  awards_received?: string;
  about?: string;
  gallery?: string;
  current_requirements?: string;
  future_plans?: string;
  awards_and_recognition?: string;
  recent_activities?: string;
};

const toCleanPayload = (
  values: ProfileFormValues,
  allowedKeys: (keyof ProfileFormValues)[]
) => {
  const payload: Partial<Donor | NGO> = {};
  allowedKeys.forEach((key) => {
    const value = values[key];
    if (value === undefined) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      payload[key] = trimmed === '' ? null : trimmed;
    } else {
      payload[key] = value ?? null;
    }
  });
  return payload;
};

const ProfileEditor: React.FC = () => {
  const { userProfile, updateProfile } = useAuth();
  const isNgo = userProfile?.user_type === 'ngo';

  const defaultValues = useMemo<ProfileFormValues>(() => {
    if (!userProfile) return {};
    return {
      name: userProfile.name ?? '',
      phone: userProfile.phone ?? '',
      address: userProfile.address ?? '',
      city: userProfile.city ?? '',
      state: userProfile.state ?? '',
      country: userProfile.country ?? '',
      pincode: userProfile.pincode ?? '',
      website: userProfile.website ?? '',
      description: userProfile.description ?? '',
      works_done: userProfile.works_done ?? '',
      awards_received: userProfile.awards_received ?? '',
      about: userProfile.about ?? '',
      gallery: userProfile.gallery ?? '',
      current_requirements: userProfile.current_requirements ?? '',
      future_plans: userProfile.future_plans ?? '',
      awards_and_recognition: userProfile.awards_and_recognition ?? '',
      recent_activities: userProfile.recent_activities ?? '',
    };
  }, [userProfile]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  if (!userProfile) {
    return null;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const baseFields: (keyof ProfileFormValues)[] = [
        'name',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'website',
        'description',
      ];

      const ngoFields: (keyof ProfileFormValues)[] = [
        'works_done',
        'awards_received',
        'about',
        'gallery',
        'current_requirements',
        'future_plans',
        'awards_and_recognition',
        'recent_activities',
      ];

      const allowed = isNgo ? [...baseFields, ...ngoFields] : baseFields;
      const payload = toCleanPayload(values, allowed);

      await updateProfile(payload);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  const renderTextInput = (
    name: keyof ProfileFormValues,
    label: string,
    placeholder?: string
  ) => (
    <div>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        {...register(name)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );

  const renderTextArea = (
    name: keyof ProfileFormValues,
    label: string,
    rows = 4,
    placeholder?: string
  ) => (
    <div>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        rows={rows}
        {...register(name)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isNgo ? 'NGO Profile' : 'Your Profile'}
        </h2>
        <p className="text-sm text-gray-500">
          Keep your information up to date so donors can learn more about you.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Registered email: {userProfile.email}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextInput('name', isNgo ? 'Organization Name' : 'Full Name')}
          {renderTextInput('phone', 'Phone Number')}
          {renderTextInput('website', 'Website (optional)', 'https://example.org')}
          {renderTextInput('pincode', 'Postal Code')}
          {renderTextInput('city', 'City')}
          {renderTextInput('state', 'State / Region')}
          {renderTextInput('country', 'Country')}
        </div>

        {renderTextArea(
          'address',
          'Address',
          3,
          'Street, area, and other details'
        )}

        {renderTextArea(
          'description',
          isNgo ? 'Short Description' : 'Bio',
          3,
          isNgo
            ? 'Summarise your mission in a few sentences.'
            : 'Tell NGOs about yourself.'
        )}

        {isNgo && (
          <div className="space-y-4">
            {renderTextArea(
              'about',
              'About the NGO',
              4,
              'Share your history, mission, and impact.'
            )}
            {renderTextArea(
              'works_done',
              'Work Done / Key Projects',
              4,
              'Highlight notable projects or initiatives.'
            )}
            {renderTextArea(
              'current_requirements',
              'Current Requirements',
              4,
              'List immediate needs or campaigns.'
            )}
            {renderTextArea(
              'future_plans',
              'Future Plans',
              4,
              'Describe your upcoming goals and roadmap.'
            )}
            {renderTextArea(
              'awards_and_recognition',
              'Awards & Recognition',
              3,
              'Mention accolades or certifications.'
            )}
            {renderTextArea(
              'recent_activities',
              'Recent Activities',
              4,
              'Share updates or recent events.'
            )}
            {renderTextArea(
              'awards_received',
              'Additional Achievements',
              3,
              'Any other achievements to highlight.'
            )}
            {renderTextArea(
              'gallery',
              'Gallery (Links or Notes)',
              3,
              'Paste links or notes about media assets.'
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving…' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Reset
          </button>
          <p className="text-xs text-gray-500">
            Your changes are saved securely to Supabase.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor;

