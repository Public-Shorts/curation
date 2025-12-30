export function normalizeSocialMediaUrl(socialMedia: string | null): string | null {
	if (socialMedia == null) return null;
	if (socialMedia.startsWith('http')) return socialMedia;
	if (socialMedia.startsWith('@')) {
		return 'https://instagram.com/' + socialMedia.slice(1);
	}
	return 'https://instagram.com/' + socialMedia;
}
