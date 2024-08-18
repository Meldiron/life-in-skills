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
	depends('combat:all');

	const data = await parent();

	async function getCombatData() {
		const response = await databases.listDocuments<Combat>('main', 'combat', [
			Query.orderDesc('$id'),
			Query.limit(1)
		]);

		if (response.documents[0]) {
			return response.documents[0];
		}

		const creation = await databases.createDocument<Combat>('main', 'combat', ID.unique(), {
			deaths: 0
		});

		return creation;
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
