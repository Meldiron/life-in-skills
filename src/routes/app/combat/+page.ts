import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
	type Skill,
	databases,
	type Activity,
	type Combat,
	type CombatAction
} from '$lib/appwrite';
import { ID, Query } from 'appwrite';

export const load: PageLoad = async ({ parent, depends }) => {
	const data = await parent();

	async function getCombatData() {
		try {
			return await databases.getDocument<Combat>('main', 'combat', data.user?.$id ?? '');
		} catch (err) {
			return await databases.createDocument<Combat>('main', 'combat', data.user?.$id ?? '', {
				deaths: 0
			});
		}
	}

	async function getCombatActions() {
		const response = await databases.listDocuments<CombatAction>('main', 'combatActions', [
			Query.limit(100)
		]);

		return response;
	}

	const [combat, combatActions] = await Promise.all([getCombatData(), getCombatActions()]);

	return {
		combat,
		combatActions: combatActions.documents
	};
};
