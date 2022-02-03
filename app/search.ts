import { Category, SearchOptions } from '~/types';
import { platforms } from '~/config';
import { capitalize } from '~/helpers';

export function getRelatedSearchParams(search: string): URLSearchParams {
	const searchParams = new URLSearchParams(search);
	const supported = [
		'list',
		'q',
		'category',
		'platform',
		'integration',
		'author',
		'site',
		'sort',
		'open', // For dialog
	];

	for (const [key, value] of Array.from(searchParams.entries())) {
		if (!supported.includes(key) || value === '') {
			searchParams.delete(key);
		}
	}

	return searchParams;
}

export function getSearchOptions(url: string): SearchOptions {
	const { pathname, searchParams } = new URL(url, 'https://remix.guide');
	const options: SearchOptions = {
		keyword: searchParams.get('q'),
		author: searchParams.get('author'),
		owner: null,
		list: null,
		site: searchParams.get('site'),
		category: searchParams.get('category'),
		platform: searchParams.get('platform'),
		integrations: searchParams.getAll('integration'),
		sort: searchParams.get('sort') ?? 'new',
	};

	if (
		pathname !== '/' &&
		pathname !== '/resources' &&
		!pathname.startsWith('/resources/')
	) {
		const [_, owner, list] =
			pathname.match(/^\/([a-z-0-9]+)(?:\/([a-z-0-9]+))*$/i) ?? [];

		if (owner) {
			options.owner = owner;
		}

		options.list = list ?? 'bookmarks';
	}

	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => [key, value ? value : null]),
	);
}

export function getSite(url: string): string {
	return new URL(url).hostname;
}

export function createIntegrationSearch(value: string): string {
	const searchParams = new URLSearchParams({ sort: 'top' });

	if (platforms.includes(value)) {
		searchParams.set('platform', value);
	} else {
		searchParams.set('integration', value);
	}

	return searchParams.toString();
}

export function getResourcePathname(options: SearchOptions): string {
	return options.owner ? `/${options.owner}/${options.list}` : '/resources';
}

export function getResourceSearchParams(
	options: SearchOptions,
): URLSearchParams {
	return new URLSearchParams(
		Object.entries(options).flatMap(([key, value]) => {
			switch (key as keyof SearchOptions) {
				case 'author':
				case 'category':
				case 'platform':
				case 'site':
				case 'keyword':
				case 'sort':
					if (value) {
						return [[key === 'keyword' ? 'q' : key, value]];
					}

					break;
				case 'integrations':
					if (Array.isArray(value)) {
						return value.map((v) => ['integration', v]);
					}

					break;
			}

			return [];
		}),
	);
}

export function getResourceURL(
	options: SearchOptions,
	resourceId?: string | null,
): string {
	const searchParams = getResourceSearchParams(options);
	let pathname = getResourcePathname(options);

	if (resourceId) {
		if (pathname === '/resources') {
			pathname = `${pathname}/${resourceId}`;
		} else {
			searchParams.set('resourceId', resourceId);
		}
	}

	const search = searchParams.toString();

	return search ? `${pathname}?${search}` : pathname;
}

export function getAction(
	options: SearchOptions,
	resourceId?: string | null,
): string {
	let action = getResourcePathname(options);

	if (options.list && resourceId) {
		action = `${action}?resourceId=${resourceId}`;
	}

	return action;
}

export function toggleSearchParams(search: string, key: string): string {
	const searchParams = new URLSearchParams(search);

	if (searchParams.get('open') === key) {
		searchParams.delete('open');
	} else {
		searchParams.set('open', key);
	}

	return searchParams.toString();
}

export function getCategoryListName(category: string): string {
	switch (category as Category) {
		case 'package':
			return 'Packages';
		case 'repository':
			return 'Examples';
		case 'others':
			return 'Others';
		default:
			return capitalize(category);
	}
}

export function getTitleBySearchOptions(searchOptions: SearchOptions): string {
	const options = Object.keys(searchOptions).reduce((result, key) => {
		switch (key as keyof SearchOptions) {
			case 'author':
				if (searchOptions.author) {
					result.push(`Made by ${searchOptions.author}`);
				}
				break;
			case 'category':
				if (searchOptions.category) {
					result.push(getCategoryListName(searchOptions.category));
				}
				break;
			case 'keyword':
				if (searchOptions.keyword?.trim()) {
					result.push(`Mentioned ${searchOptions.keyword}`);
				}
				break;
			case 'platform':
				if (searchOptions.platform) {
					result.push(`Hosted on ${searchOptions.platform}`);
				}
				break;
			case 'list':
				if (searchOptions.list) {
					result.push(capitalize(searchOptions.list));
				}
				break;
			case 'integrations':
				if ((searchOptions.integrations ?? []).length > 0) {
					result.push(`Built with ${searchOptions.integrations?.join(', ')}`);
				}
				break;
			case 'site':
				if (searchOptions.site) {
					result.push(`Published on ${searchOptions.site}`);
				}
				break;
		}

		return result;
	}, [] as string[]);

	if (options.length > 1) {
		return 'Search Result';
	}

	return options[0] ?? 'Discover';
}
