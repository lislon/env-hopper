import { EhAutoCompleteFilter } from '../ui/EhAutoComplete';

export const autoCompleteFilter: EhAutoCompleteFilter = (text: string) => {
    const pieces = text.toLowerCase().split(/\s+/);

    return (env) => {
        if (!text) {
            return true;
        }
        for (const piece of pieces) {
            if (!env.title.toLowerCase().includes(piece)) {
                return false;
            }
        }
        return true;
    }
};
