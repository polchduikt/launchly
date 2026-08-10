export interface TimezoneOption {
  value: string; // IANA timezone (e.g. "Europe/Kyiv")
  label: string; // Display name  (e.g. "(UTC+03:00) Kyiv")
  offset: number; // offset in minutes
}

function getOffset(iana: string): number {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en', {
      timeZone: iana,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tzDate = new Date(fmt.format(now));
    const diff = (tzDate.getTime() - now.getTime()) / 60000 + now.getTimezoneOffset();
    return Math.round(diff / 15) * 15;
  } catch {
    return 0;
  }
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

const RAW_TIMEZONES: { iana: string; city: string }[] = [
  { iana: 'Pacific/Midway', city: 'Midway Island' },
  { iana: 'Pacific/Honolulu', city: 'Hawaii' },
  { iana: 'America/Anchorage', city: 'Anchorage' },
  { iana: 'America/Los_Angeles', city: 'Los Angeles, Vancouver' },
  { iana: 'America/Denver', city: 'Denver, Salt Lake City' },
  { iana: 'America/Phoenix', city: 'Phoenix' },
  { iana: 'America/Chicago', city: 'Chicago, Dallas' },
  { iana: 'America/Mexico_City', city: 'Mexico City' },
  { iana: 'America/New_York', city: 'New York, Miami' },
  { iana: 'America/Halifax', city: 'Halifax' },
  { iana: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires' },
  { iana: 'America/Sao_Paulo', city: 'São Paulo, Brasília' },
  { iana: 'America/St_Johns', city: 'Newfoundland' },
  { iana: 'Atlantic/Azores', city: 'Azores' },
  { iana: 'Atlantic/Cape_Verde', city: 'Cape Verde' },
  { iana: 'Europe/London', city: 'London, Dublin' },
  { iana: 'Africa/Casablanca', city: 'Casablanca' },
  { iana: 'Europe/Lisbon', city: 'Lisbon' },
  { iana: 'Europe/Berlin', city: 'Berlin, Paris, Rome' },
  { iana: 'Europe/Amsterdam', city: 'Amsterdam, Copenhagen' },
  { iana: 'Europe/Brussels', city: 'Brussels, Warsaw' },
  { iana: 'Europe/Madrid', city: 'Madrid, Stockholm' },
  { iana: 'Europe/Zurich', city: 'Zurich, Vienna' },
  { iana: 'Africa/Lagos', city: 'Lagos, Tunis' },
  { iana: 'Africa/Johannesburg', city: 'Johannesburg' },
  { iana: 'Europe/Kyiv', city: 'Kyiv, Bucharest' },
  { iana: 'Europe/Helsinki', city: 'Helsinki, Riga, Tallinn' },
  { iana: 'Europe/Athens', city: 'Athens' },
  { iana: 'Asia/Jerusalem', city: 'Jerusalem, Tel Aviv' },
  { iana: 'Africa/Cairo', city: 'Cairo' },
  { iana: 'Asia/Beirut', city: 'Beirut' },
  { iana: 'Europe/Moscow', city: 'Moscow, St. Petersburg' },
  { iana: 'Asia/Riyadh', city: 'Riyadh, Kuwait' },
  { iana: 'Africa/Nairobi', city: 'Nairobi' },
  { iana: 'Asia/Baghdad', city: 'Baghdad' },
  { iana: 'Asia/Dubai', city: 'Dubai, Abu Dhabi' },
  { iana: 'Asia/Baku', city: 'Baku, Yerevan' },
  { iana: 'Asia/Kabul', city: 'Kabul' },
  { iana: 'Asia/Karachi', city: 'Karachi, Islamabad' },
  { iana: 'Asia/Yekaterinburg', city: 'Ekaterinburg' },
  { iana: 'Asia/Tashkent', city: 'Tashkent' },
  { iana: 'Asia/Kolkata', city: 'Mumbai, New Delhi' },
  { iana: 'Asia/Kathmandu', city: 'Kathmandu' },
  { iana: 'Asia/Dhaka', city: 'Dhaka' },
  { iana: 'Asia/Colombo', city: 'Sri Lanka' },
  { iana: 'Asia/Almaty', city: 'Almaty' },
  { iana: 'Asia/Novosibirsk', city: 'Novosibirsk' },
  { iana: 'Asia/Yangon', city: 'Yangon' },
  { iana: 'Asia/Bangkok', city: 'Bangkok, Hanoi' },
  { iana: 'Asia/Jakarta', city: 'Jakarta' },
  { iana: 'Asia/Krasnoyarsk', city: 'Krasnoyarsk' },
  { iana: 'Asia/Shanghai', city: 'Beijing, Shanghai' },
  { iana: 'Asia/Hong_Kong', city: 'Hong Kong' },
  { iana: 'Asia/Singapore', city: 'Singapore, Kuala Lumpur' },
  { iana: 'Asia/Taipei', city: 'Taipei' },
  { iana: 'Asia/Ulaanbaatar', city: 'Ulaanbaatar' },
  { iana: 'Australia/Perth', city: 'Perth' },
  { iana: 'Asia/Irkutsk', city: 'Irkutsk' },
  { iana: 'Asia/Tokyo', city: 'Tokyo, Osaka' },
  { iana: 'Asia/Seoul', city: 'Seoul' },
  { iana: 'Asia/Yakutsk', city: 'Yakutsk' },
  { iana: 'Australia/Adelaide', city: 'Adelaide' },
  { iana: 'Australia/Darwin', city: 'Darwin' },
  { iana: 'Australia/Brisbane', city: 'Brisbane' },
  { iana: 'Australia/Sydney', city: 'Sydney, Melbourne' },
  { iana: 'Australia/Hobart', city: 'Hobart' },
  { iana: 'Pacific/Guam', city: 'Guam' },
  { iana: 'Asia/Vladivostok', city: 'Vladivostok' },
  { iana: 'Pacific/Port_Moresby', city: 'Port Moresby' },
  { iana: 'Asia/Magadan', city: 'Magadan' },
  { iana: 'Pacific/Auckland', city: 'Auckland, Wellington' },
  { iana: 'Pacific/Fiji', city: 'Fiji' },
  { iana: 'Pacific/Tongatapu', city: 'Nuku\'alofa' },
];

let _cached: TimezoneOption[] | null = null;

export function getAllTimezones(): TimezoneOption[] {
  if (_cached) return _cached;
  _cached = RAW_TIMEZONES.map(({ iana, city }) => {
    const offset = getOffset(iana);
    return {
      value: iana,
      label: `(${formatOffset(offset)}) ${city}`,
      offset,
    };
  }).sort((a, b) => a.offset - b.offset);
  return _cached;
}
