import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { getRelatedSearchParams } from '~/search';

export let loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url);
	const searchParams = getRelatedSearchParams(url.search);
	const search = searchParams.toString();

	throw redirect(search ? `/discover?${search}` : '/discover');
};
