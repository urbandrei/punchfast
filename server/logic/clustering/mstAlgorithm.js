const MAX_EDGE_KM = 5;

class UnionFind {
    constructor(elements) {
        this.parent = new Map();
        this.rank = new Map();

        for (const element of elements) {
            this.parent.set(element, element);
            this.rank.set(element, 0);
        }
    }

    find(element) {
        if (this.parent.get(element) !== element) {
            this.parent.set(element, this.find(this.parent.get(element)));
        }
        return this.parent.get(element);
    }

    union(element1, element2) {
        const root1 = this.find(element1);
        const root2 = this.find(element2);

        if (root1 === root2) {
            return false;
        }

        const rank1 = this.rank.get(root1);
        const rank2 = this.rank.get(root2);

        if (rank1 < rank2) {
            this.parent.set(root1, root2);
        } else if (rank1 > rank2) {
            this.parent.set(root2, root1);
        } else {
            this.parent.set(root2, root1);
            this.rank.set(root1, rank1 + 1);
        }

        return true;
    }
}

function buildMST(stores, distanceFunc) {
    if (!stores || stores.length < 2) {
        return [];
    }

    const mstEdges = [];
    const visited = new Set();
    const pq = [];

    visited.add(stores[0].id);

    for (let i = 1; i < stores.length; i++) {
        const distance = distanceFunc(
            parseFloat(stores[0].latitude),
            parseFloat(stores[0].longitude),
            parseFloat(stores[i].latitude),
            parseFloat(stores[i].longitude)
        );

        pq.push({
            from: stores[0].id,
            to: stores[i].id,
            weight: distance
        });
    }

    while (visited.size < stores.length && pq.length > 0) {
        pq.sort((a, b) => a.weight - b.weight);
        const edge = pq.shift();

        if (visited.has(edge.to)) {
            continue;
        }

        mstEdges.push(edge);
        visited.add(edge.to);

        const newStore = stores.find(s => s.id === edge.to);
        if (!newStore) continue;

        for (const store of stores) {
            if (!visited.has(store.id)) {
                const distance = distanceFunc(
                    parseFloat(newStore.latitude),
                    parseFloat(newStore.longitude),
                    parseFloat(store.latitude),
                    parseFloat(store.longitude)
                );

                pq.push({
                    from: newStore.id,
                    to: store.id,
                    weight: distance
                });
            }
        }
    }

    return mstEdges;
}

function findConnectedComponents(stores, edges) {
    const uf = new UnionFind(stores.map(s => s.id));

    for (const edge of edges) {
        uf.union(edge.from, edge.to);
    }

    const componentMap = new Map();
    for (const store of stores) {
        const root = uf.find(store.id);
        if (!componentMap.has(root)) {
            componentMap.set(root, []);
        }
        componentMap.get(root).push(store);
    }

    return Array.from(componentMap.values());
}

function splitMST(stores, mstEdges, minSize = 3, maxSize = 7) {
    if (!stores || stores.length < minSize) {
        return [];
    }

    let edges = [...mstEdges];
    let components = findConnectedComponents(stores, edges);

    while (components.some(comp => comp.length > maxSize)) {
        const largestComponent = components.reduce((largest, current) =>
            current.length > largest.length ? current : largest
        );

        if (largestComponent.length <= maxSize) {
            break;
        }

        const componentStoreIds = new Set(largestComponent.map(s => s.id));
        const componentEdges = edges.filter(edge =>
            componentStoreIds.has(edge.from) && componentStoreIds.has(edge.to)
        );

        if (componentEdges.length === 0) {
            break;
        }

        componentEdges.sort((a, b) => b.weight - a.weight);
        const longestEdge = componentEdges[0];

        edges = edges.filter(edge =>
            edge.from !== longestEdge.from || edge.to !== longestEdge.to
        );

        components = findConnectedComponents(stores, edges);
    }

    return components.filter(comp => comp.length >= minSize && comp.length <= maxSize);
}

function findCentroid(stores, distanceFunc) {
    if (!stores || stores.length === 0) {
        return null;
    }

    if (stores.length === 1) {
        return stores[0];
    }

    let minTotalDistance = Infinity;
    let centroid = stores[0];

    for (const candidate of stores) {
        let totalDistance = 0;

        for (const store of stores) {
            if (candidate.id !== store.id) {
                totalDistance += distanceFunc(
                    parseFloat(candidate.latitude),
                    parseFloat(candidate.longitude),
                    parseFloat(store.latitude),
                    parseFloat(store.longitude)
                );
            }
        }

        if (totalDistance < minTotalDistance) {
            minTotalDistance = totalDistance;
            centroid = candidate;
        }
    }

    return centroid;
}

function orderStoresFromMST(cluster, mstEdges, distanceFunc) {
    if (!cluster || cluster.length === 0) {
        return [];
    }

    if (cluster.length === 1) {
        return [cluster[0].id];
    }

    const centroid = findCentroid(cluster, distanceFunc);

    const adjacencyList = new Map();
    for (const store of cluster) {
        adjacencyList.set(store.id, []);
    }

    const clusterStoreIds = new Set(cluster.map(s => s.id));
    for (const edge of mstEdges) {
        if (clusterStoreIds.has(edge.from) && clusterStoreIds.has(edge.to)) {
            adjacencyList.get(edge.from).push(edge.to);
            adjacencyList.get(edge.to).push(edge.from);
        }
    }

    const ordered = [];
    const visited = new Set();

    function dfs(storeId) {
        visited.add(storeId);
        ordered.push(storeId);

        const neighbors = adjacencyList.get(storeId) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
        }
    }

    dfs(centroid.id);

    return ordered;
}

function validateCluster(cluster, mstEdges) {
    if (!cluster || cluster.length === 0) {
        return false;
    }

    const clusterStoreIds = new Set(cluster.map(s => s.id));
    const clusterEdges = mstEdges.filter(edge =>
        clusterStoreIds.has(edge.from) && clusterStoreIds.has(edge.to)
    );

    for (const edge of clusterEdges) {
        if (edge.weight > MAX_EDGE_KM) {
            console.warn(`[Clustering] Cluster has edge > ${MAX_EDGE_KM}km, rejecting`);
            return false;
        }
    }

    return true;
}

module.exports = {
    buildMST,
    splitMST,
    findConnectedComponents,
    orderStoresFromMST,
    findCentroid,
    validateCluster,
    UnionFind
};
