import { Building2, CalendarDays, CarFront, Coffee, Globe2, HeartPulse, MapPin, Plane, Scissors, ShoppingBag, Star, Stethoscope, Users, Wrench, Zap } from 'lucide-react';
import { InstagramIcon as Instagram } from '../../icons/SocialIcons';

const ICONS = { Building2, CalendarDays, CarFront, Coffee, Globe2, HeartPulse, Instagram, MapPin, Plane, Scissors, ShoppingBag, Star, Stethoscope, Users, Wrench, Zap };

export type PlatformIconName = keyof typeof ICONS;

export function PlatformIcon({ name, color = 'currentColor', size = 18 }: { name: PlatformIconName; color?: string; size?: number }) {
  const Icon = ICONS[name];
  return <Icon size={size} strokeWidth={1.8} color={color} aria-hidden="true" />;
}