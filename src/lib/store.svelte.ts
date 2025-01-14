import type { AccountPrefs } from '$lib/appwrite';
import type { Models } from 'appwrite';

let _storeUser: Models.User<AccountPrefs> | null = $state(null);
export const storeUser = {
	get value() {
		return _storeUser;
	},
	set value(newVal) {
		_storeUser = newVal;
	}
};
