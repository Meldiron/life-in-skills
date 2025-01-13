
import * as moment from 'moment';
import type { Skill } from "./appwrite";

export function hasBonus(skill: Skill | null) {
    if (!skill) {
        return false;
    }

    if (!skill.lastActivityAt) {
        return true;
    }

    const lastDate = moment.default(skill.lastActivityAt).format('YYYY-MM-DD');
    const nowDate = moment.default(new Date()).format('YYYY-MM-DD');

    if (lastDate === nowDate) {
        return false;
    }

    return true;
}