import { account } from '$lib/appwrite';
import type { PageLoad } from './$types';

export let ssr = false;

export const load: PageLoad = async () => {
	let user = null;

	try {
		user = await account.get();
	} catch (err) {}

	return {
		user
	};
};
