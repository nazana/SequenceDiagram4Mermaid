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
    USER: 'mermaid_user',
    GROUPS: 'mermaid_groups'
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

export function createDiagram(title, initialCode, authorName, groupId = null) {
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
        latestVersionId: versionId,
        groupId: groupId // New field
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

export function deleteDiagram(diagramId) {
    // 1. Delete Metadata
    let diagrams = getAllDiagrams();
    diagrams = diagrams.filter(d => d.id !== diagramId);
    localStorage.setItem(KEYS.DIAGRAMS, JSON.stringify(diagrams));

    // 2. Delete Versions
    let versions = getAllVersions();
    versions = versions.filter(v => v.diagramId !== diagramId);
    localStorage.setItem(KEYS.VERSIONS, JSON.stringify(versions));
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

// --- Group Management ---
export function getAllGroups() {
    const json = localStorage.getItem(KEYS.GROUPS);
    return json ? JSON.parse(json) : [];
}

export function getGroup(id) {
    const groups = getAllGroups();
    return groups.find(g => g.id === id);
}

export function createGroup(name, parentId = null) {
    const groups = getAllGroups();
    const group = {
        id: `g_${Date.now()}`,
        name,
        parentId, // Supports nesting if needed
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    groups.push(group);
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    return group;
}

export function updateGroup(id, name) {
    const groups = getAllGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Group not found');

    groups[index].name = name;
    groups[index].updatedAt = Date.now();
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    return groups[index];
}

export function deleteGroup(id) {
    // 1. Delete the group itself
    let groups = getAllGroups();
    groups = groups.filter(g => g.id !== id);
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));

    // 2. Move children groups to Root (Safety)
    // (If we supported deep nesting, we might want to cascade delete or move up)
    groups = getAllGroups();
    let changedGroups = false;
    groups.forEach(g => {
        if (g.parentId === id) {
            g.parentId = null;
            changedGroups = true;
        }
    });
    if (changedGroups) localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));

    // 3. Move diagram items to Root
    const diagrams = getAllDiagrams();
    let changedDiagrams = false;
    diagrams.forEach(d => {
        if (d.groupId === id) {
            d.groupId = null;
            changedDiagrams = true;
        }
    });
    if (changedDiagrams) localStorage.setItem(KEYS.DIAGRAMS, JSON.stringify(diagrams));
}

export function moveDiagram(diagramId, targetGroupId) {
    const diagrams = getAllDiagrams();
    const index = diagrams.findIndex(d => d.id === diagramId);
    if (index === -1) throw new Error('Diagram not found');

    diagrams[index].groupId = targetGroupId;
    localStorage.setItem(KEYS.DIAGRAMS, JSON.stringify(diagrams));
    return diagrams[index];
}
