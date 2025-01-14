import { account, type AccountPrefs } from '$lib/appwrite';
import { storeUser } from '$lib/store.svelte';
import type { PageLoad } from './$types';

export let ssr = false;

export const load: PageLoad = async () => {
	let user = null;

	try {
		user = await account.get<AccountPrefs>();
	} catch (err) {}

	storeUser.value = user;

	return {
		user
	};
};
