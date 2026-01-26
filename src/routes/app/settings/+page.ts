import { Query } from 'appwrite';
import type { PageLoad } from './$types';
import { databases, type Skill } from '$lib/appwrite';

export const load: PageLoad = async ({ parent, depends }) => {
	const data = await parent();

	const response = await databases.listDocuments<Skill>('main', 'skills', [
		Query.limit(100),
		Query.equal('userId', data.user?.$id ?? ''),
		Query.orderAsc('position')
	]);

	return {
		skills: response.documents
	};
};
