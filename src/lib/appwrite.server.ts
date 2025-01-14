import { APPWRITE_API_KEY } from '$env/static/private';
import { Client, Users, Databases } from 'node-appwrite';

const client = new Client();
client
	.setEndpoint('https://appwrite.life-in-skills.almostapps.eu/v1')
	.setProject('life-in-skills')
	.setKey(APPWRITE_API_KEY);

export const serverUsers = new Users(client);
export const serverDatabases = new Databases(client);
