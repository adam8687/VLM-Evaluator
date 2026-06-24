/** Parse an uploaded JSON file into a normalized evaluations array. */

/**
 * @param {File} file
 * @returns {Promise<Evaluation[]>} resolves with re-sequenced evaluations
 */
export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        let importedEvals = [];
        if (Array.isArray(data)) importedEvals = data;
        else if (data && Array.isArray(data.evaluations)) importedEvals = data.evaluations;
        else throw new Error('Invalid JSON format.');

        if (importedEvals.length === 0) { reject(new Error('JSON file contains no evaluations.')); return; }
        importedEvals.forEach((ev, i) => ev.seq = i + 1);
        resolve(importedEvals);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}
