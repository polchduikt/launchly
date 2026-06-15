import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export type { User, LoginRequest, RegisterRequest, UserResponse, AuthResponse } from '../../../types/auth';

export interface AuthPageLayoutProps {
  leftTitle?: string;
  leftDescription?: string;
  rightContent: React.ReactNode;
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  registration: Partial<UseFormRegisterReturn>;
  rightElement?: React.ReactNode;
}

export interface GoogleLoginButtonProps {
  onClick: () => void;
}
