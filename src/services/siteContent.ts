import { supabase } from '@/lib/supabase';
import {
  Tag, Truck, ShieldCheck, Sprout, Package, Star, Sparkles, Leaf, Award,
  TrendingUp, Users, Heart, CheckCircle, Zap, Clock, Globe, MapPin,
  ShoppingBag, ThumbsUp, Rocket, Target, Eye, Quote, Warehouse, Home,
  Briefcase, MapPinned, type LucideIcon,
} from 'lucide-react';

export type SiteSection = 'hero' | 'footer' | 'about';

/* ----------------------------- ICON REGISTRY ----------------------------- */

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  tag: Tag,
  truck: Truck,
  'shield-check': ShieldCheck,
  sprout: Sprout,
  package: Package,
  star: Star,
  sparkles: Sparkles,
  leaf: Leaf,
  award: Award,
  'trending-up': TrendingUp,
  users: Users,
  heart: Heart,
  'check-circle': CheckCircle,
  zap: Zap,
  clock: Clock,
  globe: Globe,
  'map-pin': MapPin,
  'shopping-bag': ShoppingBag,
  'thumbs-up': ThumbsUp,
  rocket: Rocket,
  target: Target,
  eye: Eye,
  quote: Quote,
  warehouse: Warehouse,
  home: Home,
  briefcase: Briefcase,
  'map-pinned': MapPinned,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY);

export function resolveIcon(key: string | undefined, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!key) return fallback;
  return ICON_REGISTRY[key] ?? fallback;
}

/* ----------------------------- TYPES ------------------------------------- */

export interface HeroSlideConfig { image: string; title: string; subtitle: string; }
export interface HeroStatConfig { value: string; label: string; }
export interface HeroFeatureConfig { icon: string; title: string; desc: string; }

export interface HeroConfig {
  enabled: {
    badge: boolean;
    slides: boolean;
    primaryCta: boolean;
    secondaryCta: boolean;
    stats: boolean;
    features: boolean;
    dots: boolean;
  };
  badge: string;
  slides: HeroSlideConfig[];
  primaryCta: { text: string; link: string };
  secondaryCta: { text: string; link: string };
  stats: HeroStatConfig[];
  features: HeroFeatureConfig[];
}

export type FooterLinkType = 'category' | 'route' | 'external';

export interface FooterLinkConfig {
  label: string;
  type: FooterLinkType;
  value: string; // category id, route path, or URL
}

export interface FooterLinkGroupConfig {
  id: string;
  title: string;
  enabled: boolean;
  source: 'custom' | 'categories';
  categoryLimit: number;
  links: FooterLinkConfig[];
}

export interface FooterConfig {
  enabled: {
    ctaBanner: boolean;
    brand: boolean;
    linkGroups: boolean;
    social: boolean;
    copyright: boolean;
  };
  ctaBanner: { title: string; subtitle: string; ctaText: string; ctaLink: string };
  brand: { description: string; email: string; phone: string; address: string };
  linkGroups: FooterLinkGroupConfig[];
  social: { instagram: string; linkedin: string; twitter: string; facebook: string };
  copyright: string;
}

export interface AboutStatConfig { value: string; label: string; }
export interface AboutMilestoneConfig { year: string; title: string; desc: string; }
export interface AboutValueConfig { icon: string; title: string; desc: string; }
export interface AboutImpactStatConfig { icon: string; value: string; label: string; }

export interface AboutConfig {
  enabled: {
    hero: boolean;
    statsBar: boolean;
    missionVision: boolean;
    journey: boolean;
    values: boolean;
    impact: boolean;
    quote: boolean;
    cta: boolean;
  };
  hero: { badge: string; title: string; titleHighlight: string; subtitle: string; image: string };
  statsBar: { stats: AboutStatConfig[] };
  mission: { icon: string; title: string; content: string };
  vision: { icon: string; title: string; content: string };
  journey: { title: string; subtitle: string; milestones: AboutMilestoneConfig[] };
  values: { badge: string; title: string; subtitle: string; items: AboutValueConfig[] };
  impact: {
    title: string;
    subtitle: string;
    image: string;
    badgeValue: string;
    badgeLabel: string;
    stats: AboutImpactStatConfig[];
  };
  quote: { text: string; author: string; role: string };
  cta: { title: string; subtitle: string; ctaText: string; ctaLink: string };
}

/* ----------------------------- DEFAULTS ---------------------------------- */

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  enabled: { badge: true, slides: true, primaryCta: true, secondaryCta: true, stats: true, features: true, dots: true },
  badge: 'Wholesale Kitchen Supplies',
  slides: [
    { image: 'https://images.pexels.com/photos/1656664/pexels-photo-1656664.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600', title: 'Fresh Produce, Delivered Daily', subtitle: 'Farm-fresh fruits & vegetables sourced responsibly and delivered overnight' },
    { image: 'https://images.pexels.com/photos/7456559/pexels-photo-7456559.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600', title: 'Quality You Can Taste', subtitle: 'Handpicked ingredients for professional kitchens across 130+ cities' },
    { image: 'https://images.pexels.com/photos/8093836/pexels-photo-8093836.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600', title: 'Powering Every Kitchen', subtitle: 'From home chefs to restaurant chains — everything you need, in one place' },
  ],
  primaryCta: { text: 'Browse Categories', link: '/categories' },
  secondaryCta: { text: 'Why Cafkart?', link: '/about' },
  stats: [
    { value: '130+', label: 'Cities Covered' },
    { value: '2L+', label: 'Happy Businesses' },
    { value: '10k+', label: 'Fresh Products' },
    { value: '24hr', label: 'Delivery Time' },
  ],
  features: [
    { icon: 'tag', title: 'Wholesale Pricing', desc: 'Direct from source, no middlemen' },
    { icon: 'truck', title: 'Next-Day Delivery', desc: 'Across 130+ cities in India' },
    { icon: 'shield-check', title: 'Quality Assured', desc: 'Cold-chain freshness, every order' },
    { icon: 'sprout', title: 'Responsibly Sourced', desc: 'Farm-to-kitchen supply chain' },
  ],
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  enabled: { ctaBanner: true, brand: true, linkGroups: true, social: true, copyright: true },
  ctaBanner: {
    title: 'Ready to power your kitchen?',
    subtitle: 'Join 2 lakh+ food businesses sourcing with Cafkart.',
    ctaText: 'Start Ordering Today',
    ctaLink: '/categories',
  },
  brand: {
    description: 'An end-to-end sourcing platform for every kind of food business in India. We provide professional kitchens with everything they need, sourced responsibly.',
    email: 'team@cafkart.com',
    phone: '+91 70905 07673',
    address: 'Bengaluru, Karnataka 560029, IN',
  },
  linkGroups: [
    { id: 'categories', title: 'Categories', enabled: true, source: 'categories', categoryLimit: 7, links: [] },
    {
      id: 'company', title: 'Company', enabled: true, source: 'custom', categoryLimit: 0,
      links: [
        { label: 'About Us', type: 'route', value: '/about' },
        { label: 'Our Delivery Models', type: 'route', value: '/about' },
        { label: 'Culinary Development Centre', type: 'route', value: '/about' },
        { label: 'Sustainability', type: 'route', value: '/about' },
        { label: 'Careers', type: 'route', value: '/about' },
        { label: 'Press & Media', type: 'route', value: '/about' },
      ],
    },
    {
      id: 'support', title: 'Support', enabled: true, source: 'custom', categoryLimit: 0,
      links: [
        { label: 'Help Center', type: 'route', value: '/help' },
        { label: 'Track Order', type: 'route', value: '/orders' },
        { label: 'GST Invoices', type: 'route', value: '/gst-report' },
      ],
    },
  ],
  social: { instagram: '#', linkedin: '#', twitter: '#', facebook: '#' },
  copyright: 'Cafkart. All rights reserved.',
};

export const DEFAULT_ABOUT_CONFIG: AboutConfig = {
  enabled: { hero: true, statsBar: true, missionVision: true, journey: true, values: true, impact: true, quote: true, cta: true },
  hero: {
    badge: 'Our Story',
    title: "Building the backbone of",
    titleHighlight: "India's professional kitchens",
    subtitle: 'We are not just a supplier. We are a support system — sourcing responsibly, delivering reliably, and helping food businesses across India grow with confidence.',
    image: 'https://images.pexels.com/photos/11678429/pexels-photo-11678429.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600',
  },
  statsBar: {
    stats: [
      { value: '130+', label: 'Cities Covered' },
      { value: '2L+', label: 'Happy Businesses' },
      { value: '10k+', label: 'Fresh Products' },
      { value: '24hr', label: 'Delivery Time' },
    ],
  },
  mission: { icon: 'target', title: 'Our Mission', content: 'To empower every food business in India with a reliable, transparent, and affordable supply chain — from the smallest home bakery to the largest restaurant chain. We remove the friction of sourcing so kitchens can focus on what they do best: making great food.' },
  vision: { icon: 'eye', title: 'Our Vision', content: 'A future where no kitchen in India struggles with sourcing. Where quality ingredients are accessible to all, pricing is transparent, and every food entrepreneur — regardless of scale — has the infrastructure to compete and thrive.' },
  journey: {
    title: 'Our Journey',
    subtitle: 'From a single warehouse to 130+ cities across India',
    milestones: [
      { year: '2019', title: 'The Journey Begins', desc: 'Cafkart is launched with a mission to transform how professional kitchens source their ingredients.' },
      { year: '2020', title: 'Scaling Across Cities', desc: 'Expanded to 20+ cities, building a robust cold-chain network for farm-fresh delivery.' },
      { year: '2022', title: '1 Lakh Partners Strong', desc: 'Crossed 1 lakh partnered food businesses and introduced our tech-enabled procurement platform.' },
      { year: '2024', title: 'Culinary Development Centre', desc: 'Launched our food park and CDC to help partners standardise recipes and scale operations.' },
      { year: '2025', title: '130+ Cities & Counting', desc: 'Now serving over 2 lakh food businesses across 130+ cities with 1.1 crore+ orders delivered.' },
    ],
  },
  values: {
    badge: 'What We Stand For',
    title: 'Our Core Values',
    subtitle: 'The principles that guide every decision we make, every partnership we form, and every order we deliver.',
    items: [
      { icon: 'shield-check', title: 'Quality First', desc: 'Every product passes through rigorous quality checks. Our cold chain ensures freshness from farm to kitchen, every single order.' },
      { icon: 'sprout', title: 'Responsible Sourcing', desc: 'We work directly with farmers and producers, cutting out middlemen to ensure fair prices and sustainable practices.' },
      { icon: 'trending-up', title: 'Transparent Pricing', desc: 'Live rates, no hidden costs. What you see is what you pay — wholesale pricing that helps your business grow.' },
      { icon: 'users', title: 'Partners, Not Customers', desc: 'We see ourselves as an extension of your team. Your growth is our growth, and we invest deeply in your success.' },
      { icon: 'truck', title: 'Reliable Delivery', desc: 'Next-day wholesale and same-day express options. We have never let timing be the reason your kitchen suffers.' },
      { icon: 'award', title: 'Continuous Innovation', desc: 'Our Culinary Development Centre and tech platform evolve constantly to solve real kitchen challenges.' },
    ],
  },
  impact: {
    title: 'Our Impact, In Numbers',
    subtitle: 'Every number represents a kitchen we help run smoother, a business we help grow, and a customer who trusts us with their daily operations. We do not take that trust lightly.',
    image: 'https://images.pexels.com/photos/7843985/pexels-photo-7843985.jpeg?auto=compress&cs=tinysrgb&h=600&w=800',
    badgeValue: '130+',
    badgeLabel: 'cities with active delivery',
    stats: [
      { icon: 'users', value: '2 Lakh+', label: 'Food businesses served' },
      { icon: 'truck', value: '1.1 Crore+', label: 'Orders delivered' },
      { icon: 'sprout', value: '500+', label: 'Direct farm partnerships' },
      { icon: 'award', value: '1000+', label: 'Seller brands listed' },
    ],
  },
  quote: {
    text: '"We are not just building a supply chain. We are building the infrastructure that allows every food entrepreneur in India to dream bigger."',
    author: 'Arjun Mehta',
    role: 'Founder & CEO, Cafkart',
  },
  cta: {
    title: 'Ready to power your kitchen?',
    subtitle: 'Join 2 lakh+ food businesses across India that trust Cafkart for their daily sourcing needs.',
    ctaText: 'Start Ordering',
    ctaLink: '/',
  },
};

export const DEFAULT_CONFIGS: Record<SiteSection, unknown> = {
  hero: DEFAULT_HERO_CONFIG,
  footer: DEFAULT_FOOTER_CONFIG,
  about: DEFAULT_ABOUT_CONFIG,
};

/* ----------------------------- DEEP MERGE -------------------------------- */

function deepMerge<T>(base: T, override: any): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  if (base && typeof base === 'object') {
    if (typeof override !== 'object' || Array.isArray(override)) return base;
    const out: any = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge((base as any)[k], override[k]);
    }
    return out;
  }
  return override as T;
}

/* ----------------------------- CACHE + FETCH ----------------------------- */

const configCache: Partial<Record<SiteSection, unknown>> = {};
const inFlight: Partial<Record<SiteSection, Promise<unknown>>> = {};

export async function fetchSiteContent<T>(section: SiteSection): Promise<T> {
  if (configCache[section]) return configCache[section] as T;
  if (inFlight[section]) return inFlight[section] as Promise<T>;

  const defaults = DEFAULT_CONFIGS[section];

  const p = (async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('config')
        .eq('section_key', section)
        .maybeSingle();
      if (error || !data?.config) return deepMerge(defaults, null);
      return deepMerge(defaults, data.config);
    } catch {
      return deepMerge(defaults, null);
    }
  })();

  inFlight[section] = p;
  const resolved = await p;
  configCache[section] = resolved;
  return resolved as T;
}

export function getCachedSiteContent<T>(section: SiteSection): T | null {
  return (configCache[section] as T) ?? null;
}

export function invalidateSiteContent(section?: SiteSection) {
  if (section) {
    delete configCache[section];
    delete inFlight[section];
  } else {
    (Object.keys(configCache) as SiteSection[]).forEach((k) => delete configCache[k]);
    (Object.keys(inFlight) as SiteSection[]).forEach((k) => delete inFlight[k]);
  }
}

/* ----------------------------- SAVE -------------------------------------- */

export async function saveSiteContent(section: SiteSection, config: unknown): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    section_key: section,
    config,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  };

  // Upsert by section_key
  const { error } = await supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'section_key' });
  if (error) throw error;

  // Update cache
  configCache[section] = deepMerge(DEFAULT_CONFIGS[section], config);
}

/* ----------------------------- UPLOAD ------------------------------------ */

export async function uploadSiteAsset(
  file: File,
  folder: 'hero' | 'about',
  onProgress?: (percent: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'webp';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data: signed, error: signErr } = await supabase.storage
    .from('site-assets')
    .createSignedUploadUrl(path);
  if (signErr) throw signErr;

  const uploadUrl = signed.signedUrl;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
        resolve(data.publicUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(file);
  });
}

export async function deleteSiteAsset(imageUrl: string): Promise<void> {
  if (!imageUrl) return;
  const prefix = '/storage/v1/object/public/site-assets/';
  if (!imageUrl.includes(prefix)) return;
  const filePath = imageUrl.substring(imageUrl.indexOf(prefix) + prefix.length).split('?')[0];
  if (!filePath) return;
  await supabase.storage.from('site-assets').remove([filePath]);
}

/* ----------------------------- HOOK -------------------------------------- */

import { useState, useEffect } from 'react';

export function useSiteContent<T>(section: SiteSection): T {
  const [config, setConfig] = useState<T>(() => {
    const cached = getCachedSiteContent<T>(section);
    return cached ?? (DEFAULT_CONFIGS[section] as T);
  });

  useEffect(() => {
    let active = true;
    fetchSiteContent<T>(section).then((c) => {
      if (active) setConfig(c);
    });
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ section?: SiteSection }>;
      if (!ce.detail?.section || ce.detail.section === section) {
        invalidateSiteContent(section);
        fetchSiteContent<T>(section).then((c) => { if (active) setConfig(c); });
      }
    };
    window.addEventListener('site-content-updated', handler);
    return () => { active = false; window.removeEventListener('site-content-updated', handler); };
  }, [section]);

  return config;
}