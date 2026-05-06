const LEADING_PLUS_CODE_PATTERN = /^\s*[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}(?:,\s*|\s+)/i;

export function formatAddressForDisplay(address: string) {
  const trimmed = address.trim();
  const withoutPlusCode = trimmed.replace(LEADING_PLUS_CODE_PATTERN, "").trim();

  return withoutPlusCode || trimmed;
}
