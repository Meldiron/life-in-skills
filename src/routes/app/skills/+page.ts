import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { type Skill, databases } from '$lib/appwrite';
import { Query } from 'appwrite';

export const load: PageLoad = async ({ parent, depends }) => {
	const data = await parent();

	const response = await databases.listDocuments<Skill>('main', 'skills', [
		Query.equal('userId', data.user?.$id ?? '')
	]);

	return {
		skills: response.documents
	};
};
