'use client';

import { useState, useRef, useCallback } from 'react';
import { useRegionName } from '@/lib/i18n/region-name';

interface ArmeniaMapProps {
  regionCounts?: Record<string, number>;
  selectedRegionId?: string;
  onRegionClick?: (svgPathId: string) => void;
  countLabelSingular?: string;
  countLabelPlural?: string;
  densityMode?: boolean;
}

// Label center points from the SVG (used for tooltip positioning)
const REGION_CENTERS: Record<string, { cx: number; cy: number }> = {
  'region-tavush': { cx: 516.4, cy: 207.3 },
  'region-lori': { cx: 342.2, cy: 179.7 },
  'region-shirak': { cx: 163.6, cy: 184.5 },
  'region-gegharkunik': { cx: 579.1, cy: 434.9 },
  'region-vayots-dzor': { cx: 622.9, cy: 630.2 },
  'region-syunik': { cx: 823.1, cy: 766 },
  'region-ararat': { cx: 446.7, cy: 563 },
  'region-aragatsotn': { cx: 293.6, cy: 384.2 },
  'region-armavir': { cx: 186.4, cy: 485.7 },
  'region-kotayk': { cx: 408.1, cy: 392.6 },
  'region-yerevan': { cx: 358.3, cy: 474.6 },
};

const ZOOM_PADDING = 80;

// SVG path data for Armenia's 11 regions extracted from public/armenia-map.svg (Simplemaps)
// svgPathId values match the database Region.svgPathId field
const REGIONS = [
  { id: 'region-tavush', name: 'Tavush', d: 'M601.5 288.1l-0.1-0.1-5.4-2-3.6-3.6-2.6-3.5-3.3-3.1-1.8-1.3-1.8-0.9-5.1-1.4-1.6-0.6-1.5-1.2-6.6-8.2-1.7-1.5-2.6-0.9-10-1-5.7-1.7-1.7-0.2-2 0.6-8.4 6.6-2.4 1.4-11 4.7-1.6 1.2-1.4 1.5-1 2-3.4 8.9-1.1 1.7-1.2 1.5-1.4 1.2-1.7 1-4.3 1.6-12 2.4-2.1-0.2-2.2-0.5-3.3-1.4-1.7-1.2-3.6-3.5-2-1.5-4.2-2.3-4.2-1.3-34.1 7.2-6.9-5.7 0.3-22-2.3-7.3-1.1-2.2-1.5-5-0.8-2.2-0.5-1.9 0.1-1.9 1.9-2.5 2.1-1.7 5.4-2.6 9.8-2.7 2.1-1 1.7-1.5 1.6-2.1 1.6-3 6-19.6 1.2-2.6 1.3-2 1.4-1.2 1.3-0.7 0.9-0.8 2.4-2.8 1.7-1.4 1.5-1.6 0.7-1.9-1.6-3.1-3.3-2.9-1.1-1.2-1.2-2.7-1-0.9-3.4-1.6-0.8-0.6-1-0.5-1-0.2-4 0-4.2-0.4-1.9-0.6-3.6-2.1-7.2-6.4-2.7-3.1-1.1-1.8-0.2-2.1 0.5-2.2 9.3-10.9 1.8-1.3 1.8-0.5 2 0.2 1.9 0.9 3.7 2.6 2.3 0.8 2.5-0.2 3.1-1.3 18.5-14.4 0.8-2.5-0.6-3-3.3-5.1-2.9-2.4-3.1-1.5-2.4-0.7-2.1-2.1-1.4-3.7-1.1-8 0.4-5.2 0.8-2.7 1.2-1.1 4.1-2.3 4-3 1.3-1.4 0.7-1.8 0.2-1.9-0.6-2.3-2.9-3.2-9.8-6.5-6.8-0.7-0.1 0-1.9-2.8-10.8-5.2-2.3-5.4 5.5-5.6 27.7 4.4 10.9-0.4 3.5-2.4 6.5-5.9 3.5-2.2 10.6 22.6-2.9 8 1.6 4.7 4.9 2.1 18.8 0.1 4.9 1.5 15 11.9 3.7 5.4 0.3 6-9.8 7.2-28.3-1.2-3.1 12.3 3.7 6.3 6.2 4.2 5.5 0.6 1.8-4.5 0.8-7 4.8 2.6 9.3 9.8 5.9 3.6 4.4 4.8 4.7 4 13.5 1.6 12.6 5.2 6.5 1 13.4-6.7 2.7-1.3 7.9-0.9 1.8 9-2.5 12.3 3.5 3.8 4 1.1 2.9 0.7 7.6 6.3 12.2 15.8 4.6 4.7 5.8 1.9 6.8 0.4 4.9 2.7 0.6 8.4-5.4 15.6-7.6 8.6-22.2 10.7-11.6 5.6-11.2 9.3-7.2 12.7 0 9.1z m-113-163.3l-4.4 3.2-0.9 5.2 1.8 5.8 3.5 4.6 10.4 3.6 4.1-8.8-3.2-10.9-11.3-2.7z m66.1 43.3l3-4.2-8.2-7.1-1.2-0.2-1.1 0.2-1 0.6-0.9 0.9 2.8 8.8 6.6 1z' },
  { id: 'region-lori', name: 'Lori', d: 'M201.5 93.4l0.1 0 6.6-1.6 11.5-5.2 5.7-0.6 12.1 3.4 6.1-1.1 5.6-3.1 4.5-4.5 1.5-3.7 0.2-3.2 0.7-2.9 3.4-2.4 3.1 0 7.7 3.2 13.9 9.7 5.3 2 6.7-1.1 2.7-1.8 2.1-2.4 2.3-2.1 3.4-1.1 3.5 0.4 15.3 9.3 6.3 2.3 6.4 0.5 7-2.1 5.8-6.4 1.8-1.5 3.1-0.1 1.5 2.9 1 3.9 1.6 2.9 5.9 1.7 4.2-3.8 3.5-6 3.7-5 6.2-2.8 5.8 0.8 12 4.8 42 0.9 7.5-1.1 2.8-3.9-1.1-1.6 0.1 0 6.8 0.7 9.8 6.5 2.9 3.2 0.6 2.3-0.2 1.9-0.7 1.8-1.3 1.4-4 3-4.1 2.3-1.2 1.1-0.8 2.7-0.4 5.2 1.1 8 1.4 3.7 2.1 2.1 2.4 0.7 3.1 1.5 2.9 2.4 3.3 5.1 0.6 3-0.8 2.5-18.5 14.4-3.1 1.3-2.5 0.2-2.3-0.8-3.7-2.6-1.9-0.9-2-0.2-1.8 0.5-1.8 1.3-9.3 10.9-0.5 2.2 0.2 2.1 1.1 1.8 2.7 3.1 7.2 6.4 3.6 2.1 1.9 0.6 4.2 0.4 4 0 1 0.2 1 0.5 0.8 0.6 3.4 1.6 1 0.9 1.2 2.7 1.1 1.2 3.3 2.9 1.6 3.1-0.7 1.9-1.5 1.6-1.7 1.4-2.4 2.8-0.9 0.8-1.3 0.7-1.4 1.2-1.3 2-1.2 2.6-6 19.6-1.6 3-1.6 2.1-1.7 1.5-2.1 1-9.8 2.7-5.4 2.6-2.1 1.7-1.9 2.5-0.1 1.9 0.5 1.9 0.8 2.2 1.5 5 1.1 2.2 2.3 7.3-0.3 22-8.4 1.3-3 0.1-13.7-1.3-11.7-3.7-14.3-7.5-1.9-0.5-2.1 0.1-5.6 2.5-2.3 0.4-2.7-1.2-4.7-3.2-7.1 0.5-24 6.3-1.4-5.9-2-2.7-2-2.1-7.2-4.5-15.1-6.2-4.5-1.1-3.9-0.2-1.4 0.2-1 0.5-0.9 0.9-2.1 3.2-2.2 2.1-3.1 1.7-5 1-3-0.4-2.3-1-1.4-1.6-2.8-3.6-2.2-2.2-1.8-0.9-1.9-0.4-1.4 0.1-3.7 0.8-12 0.5-2-0.6-2.3-1.1-0.9-1.6-1.9-4.8-2-2.7-2-1.3-10.2-1.5-2.1-1.4-1.5-2.1-0.7-2.5-1.1-2.9-1.3-2.8-2.3-4-0.9-2.5 0-2.4 2.1-3.9 0.4-1.1 2.4-10.2 0.7-2.1 0.8-1.8 0.3-0.3 0.5-0.4 0.7-0.3 0.9-0.1 1.1 0.4 4.6 2.5 2 0.4 2.2-0.2 2.3-0.7 1.7-1.2 1.1-1.8 0.4-4.1 0.4-2.5 1.1-2.2 3.3-3.1 1.1-1.9 2.1-12.2-0.5-1.4-0.8-0.6-6.5 0.3-6.5-0.8-1.9-0.7-1.8-1.1-1.6-1.8-0.4-1.5 0.3-1.5 0.8-1 2.5-1.8 1.1-1.1 0.9-1.7 0.3-2.8-0.3-1.7-0.6-1.2-0.8-0.6-5.2-3.4-2.2-2.2-2.4-2.9-5.3-8.6-1.8-2.3-1.4-1.1-6.7-2.7-2-1.1-2.5-2.3-0.8-1.6-0.2-2.2 3.3-28.4 0.1-0.6z' },
  { id: 'region-shirak', name: 'Shirak', d: 'M201.5 93.4l-0.1 0.6-3.3 28.4 0.2 2.2 0.8 1.6 2.5 2.3 2 1.1 6.7 2.7 1.4 1.1 1.8 2.3 5.3 8.6 2.4 2.9 2.2 2.2 5.2 3.4 0.8 0.6 0.6 1.2 0.3 1.7-0.3 2.8-0.9 1.7-1.1 1.1-2.5 1.8-0.8 1-0.3 1.5 0.4 1.5 1.6 1.8 1.8 1.1 1.9 0.7 6.5 0.8 6.5-0.3 0.8 0.6 0.5 1.4-2.1 12.2-1.1 1.9-3.3 3.1-1.1 2.2-0.4 2.5-0.4 4.1-1.1 1.8-1.7 1.2-2.3 0.7-2.2 0.2-2-0.4-4.6-2.5-1.1-0.4-0.9 0.1-0.7 0.3-0.5 0.4-0.3 0.3-0.8 1.8-0.7 2.1-2.4 10.2-0.4 1.1-2.1 3.9 0 2.4 0.9 2.5 2.3 4 1.3 2.8 1.1 2.9 0.7 2.5 1.5 2.1 2.1 1.4 10.2 1.5 2 1.3 2 2.7 1.9 4.8 0.9 1.6 2.3 1.1 2 0.6 12-0.5-9.6 18.8-4.7 6.5-9.7 9.4-0.8 1.8 0.2 1.3 4.4 3.5 2.5 2.5 2 2.7 1.8 3.2 0.7 1.7 0.7 1.9 0.8 4.3 0.5 1.4 0.9 0.8 1.2 0.2 4.1-0.1 9.2-1.6 1.7 0.1 1.5 1 0.3 1.5-0.3 2.1-2.9 9.6-0.9 5.1 0 2.7 0.4 1.9 0.8 1 0.9 0.8 3 1.7 0.9 0.7-0.2 0.4-2.2 1.3-1.1 1-1.4 1.9-1 0.8-2.6 1.4-1.4 1.4-1.2 0.8-1.6 0.6-4.8 0.6-1.4 0.5-1.1 0.5-4.4 3.7-7.7 3.1-7.8 5-1.9 0.8-1.6 0.2-1.4-0.2-1.2-0.6-1.2-1-1.1-1.5-4.6-7.8-1.8-2.5-0.5-0.6-0.6-0.5-11.9-0.6-1.8 0.4-0.8 1-0.5 1.3-0.4 2.1-1 1-1.6 0.7-11.9 0.3-4.7-0.4-1.5-0.5-1.5-0.9-6-4.5-1.6-0.7-1.8-0.5-3.5-0.2-1.5-0.4-4.5-2.8-2-0.1-2.2 0.6-8.7 5.5-2.5 1.1-8 2.1-3.9 1.9-1.9 1.8-1.1 2.2-0.5 2.1-0.7 2.1-1.5 2.8-2.1 1.9-5.8 3.4-2 1.9-2.2 3-1.2 1.1-1.2 0.5-5-0.7 0.3-0.8 0-2.6-11.6-9.9-6.1-6.9-1.2-4.9 9.8-11.7 6.2-4.3 6.8-0.9-0.8-2.7-0.5-1.1-0.9-1.5 1.8 0.6 1.2 0.3 1.3 0.5 1.7 1.4-0.3-9.1 3.9-7.8 12.1-14.3-2.2-8.5 1.8-2.4 5.9-10.6 0.9-3.1-1.5-26.2-1-6.2-2.7-7.1-11.9-19.1-2.9-7.6-1.6-8.6-0.6-7.6-1.3-7.2-3.2-7.5-9-11.3-11.3-9.4-12.3-6.2-12.3-1.8-5.5-5.2-4.6-10.8-2.3-12.1 1.2-8.9 2.8 0.7 2.9 0.1 2.8-0.7 15.5-6.3 12.1-0.5 46.8 6.6 7-0.5 5.6-2.4 13.3-11.8 12.3-5.2 26.6-0.5 6.3-1.6z' },
  { id: 'region-gegharkunik', name: 'Gegharkunik', d: 'M436.1 288.5l34.1-7.2 4.2 1.3 4.2 2.3 2 1.5 3.6 3.5 1.7 1.2 3.3 1.4 2.2 0.5 2.1 0.2 12-2.4 4.3-1.6 1.7-1 1.4-1.2 1.2-1.5 1.1-1.7 3.4-8.9 1-2 1.4-1.5 1.6-1.2 11-4.7 2.4-1.4 8.4-6.6 2-0.6 1.7 0.2 5.7 1.7 10 1 2.6 0.9 1.7 1.5 6.6 8.2 1.5 1.2 1.6 0.6 5.1 1.4 1.8 0.9 1.8 1.3 3.3 3.1 2.6 3.5 3.6 3.6 5.4 2 0.1 0.1 0 7 4.1 8.7 5.5 5.5 5.8 4.6 5 6.2 1.1 3.8 0.6 8.3 1.4 4 2.6 3 5.9 4 2.5 4.3 9.2 19.9 17 15.9 66.8 37.9 0.2 0.3 12.2 13.5 5.7 0.3 2-0.6 4-1.2 6.3-0.4 4.2 2.2 4.1 4.1 7.4 9.7 0.5 2.2 0.2 2.2-0.2 2.2-5.2 24.1-3.5 9.2-5.5 7.4-6.3 5.6-1.1 2.8-3.4 17.2-1.9 4-3.9 3.3-20 1.9-47.1-7.8-18.1 11.8 0.4 3.7-0.1 0-1-0.1-2.6-1.7-1.5-2-0.6-0.8-0.9-0.7-1.1-0.3-1.3 0.1-1.8 1.6-0.9 1.2-3 4.7-4.1 3.6-10.1 5.3-4.8 1.6-19.5 3.3-7.2 0-8.8 1.6-21.1-1.1-2.6 0.5-9.1 3.5-3.5 2-3.6 2.5-11.4 10.6-13.6 8.8-2.4-5.7-0.4-2.5-0.6-8.1-0.7-3.3-1.8-4.3-1-3.2-0.6-3.4 0.3-8.4-0.3-2.4-1.2-1.3-3.1-1.4-0.8-0.6-0.7-0.9-0.6-1.3-1.1-3.4-12.1-29.7-0.6-3.6 0.2-4.7 3.2-12.4 1.5-10.8-4.3-6.5-19.6-23-1-2.4-0.2-2.4 0.7-4.2 1.6-2.5 2.6-3.1-0.6-4.4-13.3-49.8-1-2.6-2.4-2.5-8.4-5.8-1-1.5-0.5-1.7 0.5-2.7 1.2-4.7 0.5-2.6-0.4-3.2-1.2-3.5-3.1-5.1-2-2.5-1.7-1.5-1.6-0.3-6.5 0.3-1.8-0.3-1.5-1.8-1.2-2.8-3.1-20.2 0-3.5 0.5-3.1 1.9-3.9 0.9-2.1-0.9-7.3z m205.5 18.2l-9.8-3-1.7-3.6-0.6-3.9 0.6-4 1.7-3.7 3.6-2.6 3.9-1.2 4.2-0.1 4.2 0.6 7.4 4.2-3.9 9.9-9.6 7.4z' },
  { id: 'region-vayots-dzor', name: 'Vayots Dzor', d: 'M525.8 583.1l13.6-8.8 11.4-10.6 3.6-2.5 3.5-2 9.1-3.5 2.6-0.5 21.1 1.1 8.8-1.6 7.2 0 19.5-3.3 4.8-1.6 10.1-5.3 4.1-3.6 3-4.7 0.9-1.2 1.8-1.6 1.3-0.1 1.1 0.3 0.9 0.7 0.6 0.8 1.5 2 2.6 1.7 1 0.1 0.1 0 0.5 5.2 9.1 4.1 29.9 3.1 7.8 3.8 6.2 6.9 12.8 26.5-5 2.9-4.3 5.2-15.2 25.9-2.5 5.6-0.7 4.1 5.5 10.1 0.1 5.7-1.1 7.9-7.7 30.1 0.3 2 0.3 1.5 1.4 3.7 0.2 0.6 0 0.1-35.1 8.5-7.7 3.2-23 14.7-3.1 1.3-3.2 1.7-3.2 0.6-3.3-0.5-3-1.8-0.1 0-9-9.3-5-2.6-13.6-1.3-4.2-1.7-2.9-4.2-3.4-7.7-7.1-10.1-1.8-2.5-7.6 2.6-8.2 7.6-10.6 2.5-5.6-3.6-1.1-5.4 2.8-13.4 0.5-8.7-1.2-6.9-3-6.2-19-24.4 0.9-8.1 0-12.4 0.2-1.4 2-6 6.8-15.3z' },
  { id: 'region-syunik', name: 'Syunik', d: 'M726.3 588.5l2.2 4.5 12.9 12.9 6.1 3.2 9.5 4.8 18.1 5.5 7.8 7.6 11.1 22.5 9 7.3 10.8 3.1 5 2.8 4.1 5.1 6.7 12.8 4.2 4 6.4 2 9.9-2.1 19.6-10 9.8 0.7 4.1 3.3 6.7 9.2 4.3 3.1 5.7 1 18.1-1.8 4.6 1.1 4.8 3.1 3.5 4.8 0.8 6.1-2.5 4.7-4.2 2.6-3.4 3.1-0.1 6.1 2 4-0.1 3.4-1.9 2.7-3.5 1.7-0.1 0.1-21 3.9-9.1 5.6-3.8 9.6 4 11.6 9.4 7.3 20.6 9.3 4.6 3.8 2.1 5.3 1.5 5.9 2.8 5.5 6.9 7.3 12.2 8.6 1.9 1.8 2 2.2 0.3 1 1 2.5-2.5 1.3-6 0.2-13.3 9.5-3.5 0.5-17.4-8.8-10.1-1.3-6.6 6.2 0.3 11.3 7.3 7.3 9.6 5.5 6.9 5.6 3.6 12.1 1.6 10.5-0.8 10.3-3.8 11.7-0.2 1.2-0.4 1-1 4.5-0.5 4.6 0.3 4.5 1.2 4.3 9.9 21-5.1-1.4-29.9-13.4-3.9-0.8-3 0.4-7 2.2-11.1 0.5-3.8 0.9-5.5 2.7-14.9 10.8-5.1 2.4-19 2.5-16.7-31.9-15-41.8-5.8-11.7-7.4-10.7-6.1-10-2.6-9.7 1.8-9.4 6.9-9.2 1.9-2.5 0.6-2.6-0.7-2.8-1.8-2.9-5.9-5.6-16.3-8.1-4.2-2-6.9-5.3-5.4-6-5.9-4.8-16.3-4.2-0.7-1.8-1.7-3.8 1.9-7.4 9.6-15.9 1.3-5.9-2.6-16.9 0-0.1 0.9-9.4 0-6.3-2.6-4.7-6.5-4.7-7.9-3-6.7 0.1-1.6 0.4 0-0.1-0.2-0.6-1.4-3.7-0.3-1.5-0.3-2 7.7-30.1 1.1-7.9-0.1-5.7-5.5-10.1 0.7-4.1 2.5-5.6 15.2-25.9 4.3-5.2 5-2.9z' },
  { id: 'region-ararat', name: 'Ararat', d: 'M503 471.7l-1.5 10.8-3.2 12.4-0.2 4.7 0.6 3.6 12.1 29.7 1.1 3.4 0.6 1.3 0.7 0.9 0.8 0.6 3.1 1.4 1.2 1.3 0.3 2.4-0.3 8.4 0.6 3.4 1 3.2 1.8 4.3 0.7 3.3 0.6 8.1 0.4 2.5 2.4 5.7-6.8 15.3-2 6-0.2 1.4 0 12.4-0.9 8.1-2.1-2.7-9.8-4.9-10.7 3.7-10.6 8.1-1.7 1-7.5 4.2-9.7 2.3-12.6-0.2-13.3 2.5-8.1 3.6-4.4-7.6-17.6-23.2-1.6-2.9-1.4-1.2-1.4-0.3-3.2 0.5-1.4-0.2-5.3-3.3-10.4-12-3.8 2.3-1.1-2.1-0.1-4.2-0.9-3.7-4.3-3.1-2.4-2.5-1.1-3.3-1.3-5.7-3.3-5.4-7.3-8.2-16.6-14.5-23.9-14.1 0-0.3-0.2-6.2-0.7-3.8-2.5-7.1-5.1-10 0.3-1.6 1.4-2.4 3.8-3.5 4.3-7.1 2-2.2 2.7-1.7 7.9-3.2 2.5-1.5 0.7-3.1 3.4-0.9 1.3 0.6 2 1.8 0.6 1.3 0.3 1.7-0.1 1.7-0.8 4.5-0.2 2.2 0.2 1.3 0.3 1.6 0.7 1.6 0.9 1.5 1.1 1.2 0.7 0.7 0.7 0.4 10 2.4 2.9 1.3 1.9 1.7 2.6 6.1 0.6 0.9 0.9 0.9 2.9 2.4 1 0.3 1.6-0.1 3.5-0.9 7.8-5.2 12.5-16.9 2.7 1.4 2.8 6.6 2 2 3.5 1.9 1.9 0.2 14.3-2.5 11.7-3.8 21.5-12.2 8.2-3.4 10.4-3.1 11.1-4.6 8.7-1 10.8 0.6z' },
  { id: 'region-aragatsotn', name: 'Aragatsotn', d: 'M255.4 254.3l3.7-0.8 1.4-0.1 1.9 0.4 1.8 0.9 2.2 2.2 2.8 3.6 1.4 1.6 2.3 1 3 0.4 5-1 3.1-1.7 2.2-2.1 2.1-3.2 0.9-0.9 1-0.5 1.4-0.2 3.9 0.2 4.5 1.1 15.1 6.2 7.2 4.5 2 2.1 2 2.7 1.4 5.9 2.1 12.9 0 3.5-1.3 5.2 0.2 1.5 2 2.7 18.4 13.7 2.5 1.1 10.9 1.8 1.9 0.8 2 1.1-0.2 5.9-2.2 9.6-13.8 40.3 0.5 3.3 2.3 5.1 0.2 2.5-0.8 2.7-2.6 2.4-4.3 2.7-10.6 19-2.5 2.6-2.5 1.5-2.1 0.5-1.9 0.8-1 1.9 0.1 2.2 2.3 3.8 1.9 1.9 3.2 2.4 0.7 1.4-0.1 1.6-1.3 2-1.6 1.2-3.6 2.4-0.7 1.5 0 2.6 0.5 4.2 3.6 8.8-2.2 4.3-16.8-3.7-6.2-3-5.2-4-1.4-0.7-1.5-0.6-4.7-2.7-1.7-2.1-1.5-1.6-2.2-0.9-3.1 0.1-5.8 1.5-3.3 1.8-2.4 1.7-1.7 0.9-1.9-0.1-2-1.3-2.5-3.1-1.1-1.1-1.4-0.6-1.6-0.4-1.8-0.2-1.7 0.3-1.8 1.4-0.2 2.3 0.4 2.5 1.6 5.6 0.2 3.6-3.3 3.4-6.2 2.5-34-0.2-2.2-0.8-2.2-1.4-4.4-3.7-4.4-5.2-2.7-1.6-11-3.9-4-2.4-7.3-6.1-1.2-0.7-2.1-0.7-7.4-1.5-2.6-1-1.6-1.1-3.5-5.7-1.3-1.3-1.6-0.1-1.9 0.9-2.9 3.4-1.7 2.5-1.8 1.9-2 0.3-3-1.7-2.2-1.6-2.4-0.5-2.3 1-6.6 6.1-7.2 4.4-0.3 0-4.1-9.6-12.8-16.7-7.7-7.3-3-5.9 2-6.1 2.4-4.2 4.3-14.4 5 0.7 1.2-0.5 1.2-1.1 2.2-3 2-1.9 5.8-3.4 2.1-1.9 1.5-2.8 0.7-2.1 0.5-2.1 1.1-2.2 1.9-1.8 3.9-1.9 8-2.1 2.5-1.1 8.7-5.5 2.2-0.6 2 0.1 4.5 2.8 1.5 0.4 3.5 0.2 1.8 0.5 1.6 0.7 6 4.5 1.5 0.9 1.5 0.5 4.7 0.4 11.9-0.3 1.6-0.7 1-1 0.4-2.1 0.5-1.3 0.8-1 1.8-0.4 11.9 0.6 0.6 0.5 0.5 0.6 1.8 2.5 4.6 7.8 1.1 1.5 1.2 1 1.2 0.6 1.4 0.2 1.6-0.2 1.9-0.8 7.8-5 7.7-3.1 4.4-3.7 1.1-0.5 1.4-0.5 4.8-0.6 1.6-0.6 1.2-0.8 1.4-1.4 2.6-1.4 1-0.8 1.4-1.9 1.1-1 2.2-1.3 0.2-0.4-0.9-0.7-3-1.7-0.9-0.8-0.8-1-0.4-1.9 0-2.7 0.9-5.1 2.9-9.6 0.3-2.1-0.3-1.5-1.5-1-1.7-0.1-9.2 1.6-4.1 0.1-1.2-0.2-0.9-0.8-0.5-1.4-0.8-4.3-0.7-1.9-0.7-1.7-1.8-3.2-2-2.7-2.5-2.5-4.4-3.5-0.2-1.3 0.8-1.8 9.7-9.4 4.7-6.5 9.6-18.8z' },
  { id: 'region-armavir', name: 'Armavir', d: 'M334.1 475.5l-0.7 3.1-2.5 1.5-7.9 3.2-2.7 1.7-2 2.2-4.3 7.1-3.8 3.5-1.4 2.4-0.3 1.6 5.1 10 2.5 7.1 0.7 3.8 0.2 6.2 0 0.3-15.8-9.3-10.5-3.2-9.7 0-17.3 4.7-8.2 1-5.9 1.7-2.9 0.5-2.5-0.9-3.6-3.5-2.8-0.8-6.1 1.7-10 7-4.6 1.6-34.5-5.9-31.3-17.4-26.2-7.5-13.2-7.2-3.7-10.9 4-3.7 13-2.8 2.8-4.8-1.9-4.3-8.9-11-3.1-6.6 5.3-4.1-0.3-0.7 0.3 0 7.2-4.4 6.6-6.1 2.3-1 2.4 0.5 2.2 1.6 3 1.7 2-0.3 1.8-1.9 1.7-2.5 2.9-3.4 1.9-0.9 1.6 0.1 1.3 1.3 3.5 5.7 1.6 1.1 2.6 1 7.4 1.5 2.1 0.7 1.2 0.7 7.3 6.1 4 2.4 11 3.9 2.7 1.6 4.4 5.2 4.4 3.7 2.2 1.4 2.2 0.8 34 0.2 6.2-2.5 3.3-3.4-0.2-3.6-1.6-5.6-0.4-2.5 0.2-2.3 1.8-1.4 1.7-0.3 1.8 0.2 1.6 0.4 1.4 0.6 1.1 1.1 2.5 3.1 2 1.3 1.9 0.1 1.7-0.9 2.4-1.7 3.3-1.8 5.8-1.5 3.1-0.1 2.2 0.9 1.5 1.6 1.7 2.1 4.7 2.7 1.5 0.6 1.4 0.7 5.2 4 6.2 3 16.8 3.7 2.7 3.7 0.5 5 0.4 1.6 2.8 3.2z' },
  { id: 'region-kotayk', name: 'Kotayk', d: 'M429.2 282.8l6.9 5.7 0.9 7.3-0.9 2.1-1.9 3.9-0.5 3.1 0 3.5 3.1 20.2 1.2 2.8 1.5 1.8 1.8 0.3 6.5-0.3 1.6 0.3 1.7 1.5 2 2.5 3.1 5.1 1.2 3.5 0.4 3.2-0.5 2.6-1.2 4.7-0.5 2.7 0.5 1.7 1 1.5 8.4 5.8 2.4 2.5 1 2.6 13.3 49.8 0.6 4.4-2.6 3.1-1.6 2.5-0.7 4.2 0.2 2.4 1 2.4 19.6 23 4.3 6.5-10.8-0.6-8.7 1-11.1 4.6-10.4 3.1-8.2 3.4-21.5 12.2-11.7 3.8-14.3 2.5-1.9-0.2-3.5-1.9-2-2-2.8-6.6-2.7-1.4-2.2-5.6-1.9-1.4-1.8-0.6-5.6 0.7-4.9-0.3-1.9-1.4-0.8-2.2 0.5-2.5 0.8-2.6 0.9-2.4 1-1.9 0.9-1.4 4.6-5 1.2-1.6 0.8-1.6-0.4-0.9-1.3-1.7-2.5-2.3-4.1-5.5-2.7-1.6-2.3-0.8-3.2 0.9-8.1 4.1-1.7 0.4-11.2 1.1-3.5-0.9-0.9 0-0.8 0.4-1.8 1.2-0.9 0.3-1.5 0.2-1.6-0.1-2.9-0.5-1 0.1-0.7 0.3-0.6 0.5-0.4 0.6-0.2 0.4-0.8 1.7-3.6-8.8-0.5-4.2 0-2.6 0.7-1.5 3.6-2.4 1.6-1.2 1.3-2 0.1-1.6-0.7-1.4-3.2-2.4-1.9-1.9-2.3-3.8-0.1-2.2 1-1.9 1.9-0.8 2.1-0.5 2.5-1.5 2.5-2.6 10.6-19 4.3-2.7 2.6-2.4 0.8-2.7-0.2-2.5-2.3-5.1-0.5-3.3 13.8-40.3 2.2-9.6 0.2-5.9-2-1.1-1.9-0.8-10.9-1.8-2.5-1.1-18.4-13.7-2-2.7-0.2-1.5 1.3-5.2 0-3.5-2.1-12.9 24-6.3 7.1-0.5 4.7 3.2 2.7 1.2 2.3-0.4 5.6-2.5 2.1-0.1 1.9 0.5 14.3 7.5 11.7 3.7 13.7 1.3 3-0.1 8.4-1.3z' },
  { id: 'region-yerevan', name: 'Yerevan', d: 'M393.4 489.6l-12.5 16.9-7.8 5.2-3.5 0.9-1.6 0.1-1-0.3-2.9-2.4-0.9-0.9-0.6-0.9-2.6-6.1-1.9-1.7-2.9-1.3-10-2.4-0.7-0.4-0.7-0.7-1.1-1.2-0.9-1.5-0.7-1.6-0.3-1.6-0.2-1.3 0.2-2.2 0.8-4.5 0.1-1.7-0.3-1.7-0.6-1.3-2-1.8-1.3-0.6-3.4 0.9-2.8-3.2-0.4-1.6-0.5-5-2.7-3.7 2.2-4.3 0.8-1.7 0.2-0.4 0.4-0.6 0.6-0.5 0.7-0.3 1-0.1 2.9 0.5 1.6 0.1 1.5-0.2 0.9-0.3 1.8-1.2 0.8-0.4 0.9 0 3.5 0.9 11.2-1.1 1.7-0.4 8.1-4.1 3.2-0.9 2.3 0.8 2.7 1.6 4.1 5.5 2.5 2.3 1.3 1.7 0.4 0.9-0.8 1.6-1.2 1.6-4.6 5-0.9 1.4-1 1.9-0.9 2.4-0.8 2.6-0.5 2.5 0.8 2.2 1.9 1.4 4.9 0.3 5.6-0.7 1.8 0.6 1.9 1.4 2.2 5.6z' },
];

function getRegionBBox(regionId: string): { x: number; y: number; w: number; h: number } | null {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return null;

  // Parse SVG path to extract all coordinate points for bounding box
  const coords: { x: number; y: number }[] = [];
  const numbers = region.d.match(/-?\d+\.?\d*/g);
  if (!numbers) return null;

  let cx = 0, cy = 0;
  let i = 0;
  const commands = region.d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d+\.?\d*/g);
  if (!commands) return null;

  let cmd = '';
  for (const token of commands) {
    if (/[A-Za-z]/.test(token)) {
      cmd = token;
      i = 0;
      continue;
    }
    const n = parseFloat(token);
    const isRelative = cmd === cmd.toLowerCase();

    if (cmd === 'M' || cmd === 'm') {
      if (i % 2 === 0) cx = isRelative ? cx + n : n;
      else { cy = isRelative ? cy + n : n; coords.push({ x: cx, y: cy }); }
    } else if (cmd === 'L' || cmd === 'l') {
      if (i % 2 === 0) cx = isRelative ? cx + n : n;
      else { cy = isRelative ? cy + n : n; coords.push({ x: cx, y: cy }); }
    } else if (cmd === 'H' || cmd === 'h') {
      cx = isRelative ? cx + n : n; coords.push({ x: cx, y: cy }); i++; continue;
    } else if (cmd === 'V' || cmd === 'v') {
      cy = isRelative ? cy + n : n; coords.push({ x: cx, y: cy }); i++; continue;
    } else {
      // For curves etc, just track the endpoint coordinates
      if (i % 2 === 0) cx = isRelative ? cx + n : n;
      else { cy = isRelative ? cy + n : n; coords.push({ x: cx, y: cy }); }
    }
    i++;
  }

  if (coords.length === 0) return null;
  const xs = coords.map((c) => c.x);
  const ys = coords.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}


function getRegionFillColor(
  count: number,
  isSelected: boolean,
  hasCount: boolean,
  densityMode: boolean,
) {
  if (isSelected) return '#155dfc';
  if (!hasCount) return '#d1d5dc66';
  if (!densityMode) return '#51a2ff99';
  if (count <= 10) return '#dbeafe';
  if (count <= 50) return '#93c5fd';
  if (count <= 100) return '#60a5fa';
  return '#2563eb';
}

export function ArmeniaMap({
  regionCounts = {},
  selectedRegionId,
  onRegionClick,
  countLabelSingular = 'item',
  countLabelPlural = 'items',
  densityMode = false,
}: ArmeniaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const regionName = useRegionName();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute zoom transform: scale + translate to center the selected region
  const zoomTransform = (() => {
    if (!selectedRegionId) return { scale: 1, tx: 0, ty: 0 };
    const bbox = getRegionBBox(selectedRegionId);
    if (!bbox) return { scale: 1, tx: 0, ty: 0 };

    const centerX = bbox.x + bbox.w / 2;
    const centerY = bbox.y + bbox.h / 2;
    const regionSize = Math.max(bbox.w, bbox.h) + ZOOM_PADDING * 2;
    const scale = 1000 / regionSize;
    // Translate so the region center maps to the SVG center (500, 500) after scaling
    const tx = 500 - centerX * scale;
    const ty = 500 - centerY * scale;
    return { scale, tx, ty };
  })();

  const handleMouseMove = useCallback((e: React.MouseEvent, regionId: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 12,
    });
    setHoveredRegion(regionId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredRegion(null);
    setTooltipPos(null);
  }, []);

  const activeTooltipRegion = hoveredRegion || focusedRegion || selectedRegionId;
  const tooltipData = activeTooltipRegion ? REGIONS.find((r) => r.id === activeTooltipRegion) : null;
  const tooltipCount = activeTooltipRegion ? regionCounts[activeTooltipRegion] || 0 : 0;

  const getTooltipStyleFromCenter = useCallback(
    (regionId: string | null) => {
      if (!regionId) return null;
      const center = REGION_CENTERS[regionId];
      if (!center) return null;
      const leftPercent = ((center.cx * zoomTransform.scale + zoomTransform.tx) / 1000) * 100;
      const topPercent = ((center.cy * zoomTransform.scale + zoomTransform.ty) / 1000) * 100;
      return {
        left: `${leftPercent}%`,
        top: `calc(${topPercent}% - 12px)`,
      };
    },
    [zoomTransform.scale, zoomTransform.tx, zoomTransform.ty],
  );

  // For selected region tooltip (not hovered), compute position in SVG percentage space
  const selectedTooltipStyle =
    selectedRegionId && !hoveredRegion && !focusedRegion
      ? getTooltipStyleFromCenter(selectedRegionId)
      : null;
  const focusedTooltipStyle = focusedRegion ? getTooltipStyleFromCenter(focusedRegion) : null;

  const hoveredTooltipStyle = tooltipPos ? { left: tooltipPos.x, top: tooltipPos.y } : null;
  const finalTooltipStyle = hoveredTooltipStyle ?? focusedTooltipStyle ?? selectedTooltipStyle;

  return (
    <div className="relative select-none overflow-hidden">
      {selectedRegionId && (
        <button
          type="button"
          aria-label="Reset map zoom"
          onClick={() => onRegionClick?.(selectedRegionId)}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-[#364153] shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Reset zoom
        </button>
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        className="w-full"
      >
        <g
          style={{
            transform: `translate(${zoomTransform.tx}px, ${zoomTransform.ty}px) scale(${zoomTransform.scale})`,
            transformOrigin: '0 0',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {REGIONS.map((region) => {
            const count = regionCounts[region.id] || 0;
            const isSelected = selectedRegionId === region.id;
            const hasCount = count > 0;
            const countLabel = count === 1 ? countLabelSingular : countLabelPlural;
            const ariaLabel = `${regionName({ name: region.name, svgPathId: region.id })}: ${count} ${countLabel}`;

            return (
              <g
                key={region.id}
                className="cursor-pointer"
              >
                <path
                  d={region.d}
                  role="button"
                  tabIndex={0}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  onClick={() => onRegionClick?.(region.id)}
                  onMouseMove={(e) => handleMouseMove(e, region.id)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => {
                    setFocusedRegion(region.id);
                    setHoveredRegion(null);
                    setTooltipPos(null);
                  }}
                  onBlur={() => setFocusedRegion(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRegionClick?.(region.id);
                    }
                  }}
                  fill={getRegionFillColor(count, isSelected, hasCount, densityMode)}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="transition-colors hover:fill-[#93c5fd] focus:fill-[#93c5fd] focus:outline-none"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltipData && finalTooltipStyle && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1f2937] px-3 py-2 text-sm text-white shadow-lg"
          style={finalTooltipStyle}
        >
          <div className="font-semibold">{regionName({ name: tooltipData.name, svgPathId: tooltipData.id })}</div>
          <div className="text-xs text-[#9ca3af]">
            {tooltipCount} {tooltipCount === 1 ? countLabelSingular : countLabelPlural}
          </div>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1f2937]" />
        </div>
      )}
    </div>
  );
}
