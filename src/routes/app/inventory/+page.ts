import type { PageLoad } from './$types';
import { databases, type InventoryItem } from '$lib/appwrite';
import { Query } from 'appwrite';

export const load: PageLoad = async ({ parent }) => {
	const data = await parent();

	async function getInventoryItems() {
		const response = await databases.listDocuments<InventoryItem>('main', 'inventory', [
			Query.limit(100),
			Query.orderDesc('$createdAt')
		]);

		return response;
	}

	const inventoryItems = await getInventoryItems();

	return {
		inventoryItems: inventoryItems.documents
	};
};
