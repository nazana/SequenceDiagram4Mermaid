/**
 * LocalStorage wrapper for persistent data management.
 * 
 * Schema:
 * - `mermaid_diagrams`: Array<{ id, title, createdBy, createdAt, updatedBy, updatedAt, latestVersionId }>
 * - `mermaid_versions`: Array<{ id, diagramId, code, authorName, timestamp, note }> (Flat list for simplicity)
 * - `mermaid_user`: { name, lastSeen }
 */

const KEYS = {
    DIAGRAMS: 'mermaid_diagrams',
    VERSIONS: 'mermaid_versions',
    USER: 'mermaid_user'
};

// --- User Management ---
export function getCurrentUser() {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : { name: 'Guest' };
}

export function saveUser(name) {
    const user = { name, lastSeen: Date.now() };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    return user;
}

// --- Diagram Management ---
export function getAllDiagrams() {
    const json = localStorage.getItem(KEYS.DIAGRAMS);
    return json ? JSON.parse(json) : [];
}

export function getDiagram(id) {
    const diagrams = getAllDiagrams();
    return diagrams.find(d => d.id === id);
}

export function createDiagram(title, initialCode, authorName) {
    const diagrams = getAllDiagrams();
    const versions = getAllVersions(); // Helper

    // IDs
    const diagramId = `d_${Date.now()}`;
    const versionId = `v_${Date.now()}`;

    // Create Version First
    const version = {
        id: versionId,
        diagramId,
        code: initialCode,
        authorName,
        timestamp: Date.now(),
        note: 'Initial creation'
    };
    versions.push(version);
    localStorage.setItem(KEYS.VERSIONS, JSON.stringify(versions));

    // Create Diagram Metadata
    const diagram = {
        id: diagramId,
        title,
        createdBy: authorName,
        createdAt: Date.now(),
        updatedBy: authorName,
        updatedAt: Date.now(),
        latestVersionId: versionId
    };
    diagrams.unshift(diagram); // Prepend
    localStorage.setItem(KEYS.DIAGRAMS, JSON.stringify(diagrams));

    return diagram;
}

export function updateDiagram(diagramId, code, authorName, note = 'Update') {
    const diagrams = getAllDiagrams();
    const index = diagrams.findIndex(d => d.id === diagramId);
    if (index === -1) throw new Error('Diagram not found');

    const versions = getAllVersions();
    const versionId = `v_${Date.now()}`;

    // Check if code actually changed from latest?
    // Skip optimized check for now, always save if requested.

    const version = {
        id: versionId,
        diagramId,
        code,
        authorName,
        timestamp: Date.now(),
        note
    };
    versions.push(version);
    localStorage.setItem(KEYS.VERSIONS, JSON.stringify(versions));

    // Update Metadata
    diagrams[index].updatedAt = Date.now();
    diagrams[index].updatedBy = authorName;
    diagrams[index].latestVersionId = versionId;
    localStorage.setItem(KEYS.DIAGRAMS, JSON.stringify(diagrams));

    return diagrams[index];
}

// --- Version Management ---
function getAllVersions() {
    const json = localStorage.getItem(KEYS.VERSIONS);
    return json ? JSON.parse(json) : [];
}

export function getDiagramVersions(diagramId) {
    const versions = getAllVersions();
    // Sort by timestamp desc
    return versions
        .filter(v => v.diagramId === diagramId)
        .sort((a, b) => b.timestamp - a.timestamp);
}

export function getVersion(versionId) {
    const versions = getAllVersions();
    return versions.find(v => v.id === versionId);
}
