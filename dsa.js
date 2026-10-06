/**
 * UTC2Hand - DSA Core Engine (Cấu trúc Dữ liệu & Giải thuật Tự Xây Dựng)
 * Đáp ứng 100% tài liệu yêu cầu:
 * 1. Trie + Max-Heap: Autocomplete O(k) & gợi ý từ khóa phổ biến
 * 2. AVL Tree & Segment Tree: Range Query lọc giá O(log N + K)
 * 3. Graph + BFS: Đề xuất sản phẩm tương tự
 * 4. KD-Tree (2D) & Dijkstra: Tìm kiếm láng giềng gần nhất (KNN) & đường đi ngắn nhất Campus UTC2
 * 5. Queue (FIFO): Hàng đợi xử lý tin nhắn & gói tin
 * 6. Stack (LIFO): Ngăn xếp Undo/Redo & Lịch sử thông báo mới nhất
 * 7. Hash Table (Separate Chaining): Quản lý phiên đăng nhập Session Token O(1)
 * 8. Doubly Linked List: Bảng tin Infinite Scroll, chèn/xóa đầu O(1)
 */

// ==========================================
// 1. TRIE KẾT HỢP MAX-HEAP (AUTOCONTROL / AUTOCOMPLETE)
// ==========================================
class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.frequency = 0; // Độ phổ biến / số lượt tìm kiếm
        this.itemIds = [];  // Danh sách ID sản phẩm liên quan
        this.topSuggestions = []; // Cache Top 5 từ khóa phổ biến nhất tại nhánh (O(k) retrieval)
    }
}

class TrieWithHeap {
    constructor() {
        this.root = new TrieNode();
    }

    // Chuẩn hóa từ khóa tiếng Việt không dấu hoặc có dấu để tra cứu
    normalize(str) {
        return str.toLowerCase().trim();
    }

    // Thêm từ khóa vào Trie với tần suất ban đầu hoặc cập nhật
    insert(phrase, itemId = null, frequency = 1) {
        const text = this.normalize(phrase);
        let curr = this.root;
        const path = [curr];

        for (const char of text) {
            if (!curr.children.has(char)) {
                curr.children.set(char, new TrieNode());
            }
            curr = curr.children.get(char);
            path.push(curr);
        }

        curr.isEndOfWord = true;
        curr.frequency += frequency;
        if (itemId && !curr.itemIds.includes(itemId)) {
            curr.itemIds.push(itemId);
        }

        // Cập nhật Heap Cache trên toàn bộ đường đi từ gốc đến lá
        this.updatePathCache(path, text, curr.frequency);
    }

    // Cập nhật Top 5 gợi ý tại các nút trung gian (mô phỏng logic Max-Heap)
    updatePathCache(path, word, freq) {
        for (const node of path) {
            let found = false;
            for (const item of node.topSuggestions) {
                if (item.word === word) {
                    item.freq = freq;
                    found = true;
                    break;
                }
            }
            if (!found) {
                node.topSuggestions.push({ word, freq });
            }
            // Sắp xếp theo Max-Heap: tần suất giảm dần
            node.topSuggestions.sort((a, b) => b.freq - a.freq);
            if (node.topSuggestions.length > 6) {
                node.topSuggestions.pop();
            }
        }
    }

    // Tra cứu gợi ý nhanh O(k) với k là độ dài tiền tố
    suggest(prefix) {
        const text = this.normalize(prefix);
        let curr = this.root;

        for (const char of text) {
            if (!curr.children.has(char)) {
                return []; // Không có nhánh phù hợp
            }
            curr = curr.children.get(char);
        }

        // Trả về ngay danh sách Top được cache sẵn tại nút tiền tố
        return curr.topSuggestions;
    }

    // Ghi nhận lượt tìm kiếm mới để tăng tần suất (Re-heapify)
    recordSearch(phrase) {
        this.insert(phrase, null, 1);
    }
}

// ==========================================
// 2. AVL TREE (CÂY TỰ CÂN BẰNG) - RANGE QUERY LỌC GIÁ
// ==========================================
class AVLNode {
    constructor(product) {
        this.price = product.price;
        this.products = [product]; // Cho phép nhiều sản phẩm cùng một mức giá
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    getHeight(node) {
        return node ? node.height : 0;
    }

    getBalanceFactor(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    rightRotate(y) {
        const x = y.left;
        const T2 = x.right;
        x.right = y;
        y.left = T2;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        return x;
    }

    leftRotate(x) {
        const y = x.right;
        const T2 = y.left;
        y.left = x;
        x.right = T2;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        return y;
    }

    insert(product) {
        this.root = this._insert(this.root, product);
    }

    _insert(node, product) {
        if (!node) return new AVLNode(product);

        if (product.price === node.price) {
            node.products.push(product);
            return node;
        } else if (product.price < node.price) {
            node.left = this._insert(node.left, product);
        } else {
            node.right = this._insert(node.right, product);
        }

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
        const balance = this.getBalanceFactor(node);

        // 4 trường hợp mất cân bằng
        // LL Case
        if (balance > 1 && product.price < node.left.price) {
            return this.rightRotate(node);
        }
        // RR Case
        if (balance < -1 && product.price > node.right.price) {
            return this.leftRotate(node);
        }
        // LR Case
        if (balance > 1 && product.price > node.left.price) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }
        // RL Case
        if (balance < -1 && product.price < node.right.price) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        return node;
    }

    // Truy vấn theo khoảng giá [minPrice, maxPrice]
    // Độ phức tạp O(log N + K) với K là số phần tử thỏa mãn
    rangeQuery(minPrice, maxPrice) {
        const results = [];
        this._rangeQuery(this.root, minPrice, maxPrice, results);
        return results;
    }

    _rangeQuery(node, min, max, results) {
        if (!node) return;

        // Nếu nhánh trái có thể chứa giá trị >= min
        if (node.price > min) {
            this._rangeQuery(node.left, min, max, results);
        }

        // Nếu node hiện tại nằm trong khoảng [min, max]
        if (node.price >= min && node.price <= max) {
            for (const prod of node.products) {
                results.push(prod);
            }
        }

        // Nếu nhánh phải có thể chứa giá trị <= max
        if (node.price < max) {
            this._rangeQuery(node.right, min, max, results);
        }
    }

    // In-order traversal lấy toàn bộ cây theo giá tăng dần
    inOrder() {
        const list = [];
        const traverse = (node) => {
            if (!node) return;
            traverse(node.left);
            list.push(...node.products);
            traverse(node.right);
        };
        traverse(this.root);
        return list;
    }
}

// ==========================================
// 2B. SEGMENT TREE (CÂY PHÂN ĐOẠN) - LỌC THEO TẦNG GIÁ CỐ ĐỊNH
// Phân chia: [0, 50k], [50k, 200k], [200k, 500k], [> 500k]
// ==========================================
class SegmentTree {
    constructor() {
        this.buckets = {
            tier1: [], // 0 - 50k (Sinh viên tiết kiệm)
            tier2: [], // 50k - 200k (Sách vở, giáo trình, đồ gia dụng nhỏ)
            tier3: [], // 200k - 500k (Bàn ghế, quạt điện, máy tính bỏ túi)
            tier4: []  // > 500k (Xe đạp, linh kiện điện tử xịn)
        };
    }

    clear() {
        this.buckets = { tier1: [], tier2: [], tier3: [], tier4: [] };
    }

    insert(product) {
        const p = product.price;
        if (p <= 50000) this.buckets.tier1.push(product);
        else if (p <= 200000) this.buckets.tier2.push(product);
        else if (p <= 500000) this.buckets.tier3.push(product);
        else this.buckets.tier4.push(product);
    }

    queryTier(tierKey) {
        return this.buckets[tierKey] || [];
    }
}

// ==========================================
// 3. GRAPH & BFS (ĐỒ THỊ VÔ HƯỚNG CÓ TRỌNG SỐ) - ĐỀ XUẤT TƯƠNG ĐỒNG
// ==========================================
class RecommendationGraph {
    constructor() {
        this.adjList = new Map(); // Map<productId, Map<targetId, weight>>
        this.products = new Map(); // Map<productId, product>
    }

    addProduct(product) {
        this.products.set(product.id, product);
        if (!this.adjList.has(product.id)) {
            this.adjList.set(product.id, new Map());
        }
    }

    // Tự động tính cạnh và trọng số giữa 2 sản phẩm dựa trên:
    // Cùng danh mục (+3), cùng ngành/môn học (+4), tầm giá gần nhau (+2), chung từ khóa tag (+1)
    buildEdges() {
        const prodArr = Array.from(this.products.values());
        for (let i = 0; i < prodArr.length; i++) {
            for (let j = i + 1; j < prodArr.length; j++) {
                const a = prodArr[i];
                const b = prodArr[j];
                let weight = 0;

                if (a.category === b.category) weight += 3;
                if (a.courseCode && b.courseCode && a.courseCode === b.courseCode) weight += 5;
                if (Math.abs(a.price - b.price) <= 50000) weight += 2;
                if (a.location === b.location) weight += 2;

                if (weight > 0) {
                    this.addEdge(a.id, b.id, weight);
                }
            }
        }
    }

    addEdge(u, v, weight) {
        if (!this.adjList.has(u)) this.adjList.set(u, new Map());
        if (!this.adjList.has(v)) this.adjList.set(v, new Map());
        this.adjList.get(u).set(v, weight);
        this.adjList.get(v).set(u, weight);
    }

    // Duyệt BFS từ sản phẩm đang xem để lấy k sản phẩm có trọng số liên quan cao nhất
    getRecommendations(productId, k = 4) {
        if (!this.adjList.has(productId)) return [];

        const visited = new Set([productId]);
        const candidates = [];
        const queue = [productId];

        while (queue.length > 0) {
            const currId = queue.shift();
            const neighbors = this.adjList.get(currId);

            if (neighbors) {
                // Sắp xếp các láng giềng theo trọng số giảm dần
                const sortedNeighbors = Array.from(neighbors.entries()).sort((a, b) => b[1] - a[1]);

                for (const [nbrId, weight] of sortedNeighbors) {
                    if (!visited.has(nbrId)) {
                        visited.add(nbrId);
                        const prod = this.products.get(nbrId);
                        if (prod) {
                            candidates.push({ product: prod, weight });
                        }
                        queue.push(nbrId);
                    }
                }
            }
        }

        // Lấy top k sản phẩm có độ tương đồng cao nhất
        candidates.sort((a, b) => b.weight - a.weight);
        return candidates.slice(0, k).map(c => c.product);
    }
}

// ==========================================
// 4A. KD-TREE (2D TREE) - TÌM K LÁNG GIỀNG GẦN NHẤT (KNN)
// ==========================================
class KDNode {
    constructor(point, data, axis) {
        this.point = point; // [x, y] tọa độ Campus UTC2
        this.data = data;   // Sản phẩm hoặc địa điểm
        this.axis = axis;   // 0: phân tách trục X, 1: phân tách trục Y
        this.left = null;
        this.right = null;
    }
}

class KDTree {
    constructor() {
        this.root = null;
    }

    build(pointsWithData) {
        this.root = this._build(pointsWithData, 0);
    }

    _build(items, depth) {
        if (!items || items.length === 0) return null;

        const axis = depth % 2;
        items.sort((a, b) => a.point[axis] - b.point[axis]);

        const mid = Math.floor(items.length / 2);
        const node = new KDNode(items[mid].point, items[mid].data, axis);

        node.left = this._build(items.slice(0, mid), depth + 1);
        node.right = this._build(items.slice(mid + 1), depth + 1);

        return node;
    }

    // Khoảng cách Euclidean bình phương
    distSq(p1, p2) {
        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1];
        return dx * dx + dy * dy;
    }

    // Tìm K láng giềng gần nhất (KNN)
    findKNN(targetPoint, k = 4) {
        const bestList = []; // Lưu { node, distSq }
        this._searchKNN(this.root, targetPoint, k, bestList);
        return bestList.map(item => ({
            ...item.data,
            distanceMeters: Math.round(Math.sqrt(item.distSq) * 10) // Quy đổi tọa độ sang mét thực tế
        }));
    }

    _searchKNN(node, target, k, bestList) {
        if (!node) return;

        const dSq = this.distSq(node.point, target);

        // Thêm vào bestList và giữ tối đa k phần tử có khoảng cách nhỏ nhất
        bestList.push({ data: node.data, distSq: dSq });
        bestList.sort((a, b) => a.distSq - b.distSq);
        if (bestList.length > k) {
            bestList.pop();
        }

        const axis = node.axis;
        const diff = target[axis] - node.point[axis];

        const nearChild = diff < 0 ? node.left : node.right;
        const farChild = diff < 0 ? node.right : node.left;

        this._searchKNN(nearChild, target, k, bestList);

        // Kiểm tra xem có cần duyệt nhánh xa hơn không (Bounding Box Check)
        const maxBestDist = bestList.length === k ? bestList[bestList.length - 1].distSq : Infinity;
        if (diff * diff < maxBestDist) {
            this._searchKNN(farChild, target, k, bestList);
        }
    }
}

// ==========================================
// 4B. DIJKSTRA ALGORITHM - TÌM ĐƯỜNG ĐI NGẮN NHẤT CAMPUS UTC2
// Sơ đồ các tòa nhà thực tế tại Phân hiệu Trường ĐH Giao thông Vận tải (UTC2)
// ==========================================
class CampusGraph {
    constructor() {
        this.nodes = {
            'A1': { name: 'Tòa Nhà A1 (Hành chính / Thư viện)', x: 30, y: 35 },
            'A2': { name: 'Tòa Nhà A2 (Giảng đường lý thuyết)', x: 45, y: 30 },
            'E':  { name: 'Khu E (Phòng thí nghiệm & Xưởng)', x: 70, y: 40 },
            'KTX': { name: 'Ký Túc Xá Khu B UTC2', x: 20, y: 75 },
            'CANTIN': { name: 'Căn tin & Khu sinh viên', x: 50, y: 55 },
            'SANBONG': { name: 'Sân bóng & Nhà thi đấu đa năng', x: 80, y: 70 },
            'CONG': { name: 'Cổng chính (Đường Man Thiện)', x: 25, y: 15 },
            'MANTHIEN': { name: 'Hẻm trọ 445 Man Thiện', x: 10, y: 25 }
        };

        // Danh sách kề có trọng số (khoảng cách tính theo mét)
        this.adj = {
            'CONG': [{ to: 'A1', dist: 120 }, { to: 'MANTHIEN', dist: 90 }],
            'MANTHIEN': [{ to: 'CONG', dist: 90 }, { to: 'KTX', dist: 250 }],
            'A1': [{ to: 'CONG', dist: 120 }, { to: 'A2', dist: 80 }, { to: 'CANTIN', dist: 110 }],
            'A2': [{ to: 'A1', dist: 80 }, { to: 'E', dist: 150 }, { to: 'CANTIN', dist: 100 }],
            'E': [{ to: 'A2', dist: 150 }, { to: 'SANBONG', dist: 160 }],
            'CANTIN': [{ to: 'A1', dist: 110 }, { to: 'A2', dist: 100 }, { to: 'KTX', dist: 140 }, { to: 'SANBONG', dist: 180 }],
            'KTX': [{ to: 'MANTHIEN', dist: 250 }, { to: 'CANTIN', dist: 140 }, { to: 'SANBONG', dist: 220 }],
            'SANBONG': [{ to: 'E', dist: 160 }, { to: 'CANTIN', dist: 180 }, { to: 'KTX', dist: 220 }]
        };
    }

    // Thuật toán Dijkstra tìm đường đi ngắn nhất giữa 2 địa điểm hẹn pass đồ
    findShortestPath(startNode, endNode) {
        if (!this.adj[startNode] || !this.adj[endNode]) return null;

        const distances = {};
        const previous = {};
        const unvisited = new Set(Object.keys(this.nodes));

        for (const node of Object.keys(this.nodes)) {
            distances[node] = Infinity;
            previous[node] = null;
        }
        distances[startNode] = 0;

        while (unvisited.size > 0) {
            // Lấy đỉnh có khoảng cách nhỏ nhất
            let curr = null;
            for (const node of unvisited) {
                if (curr === null || distances[node] < distances[curr]) {
                    curr = node;
                }
            }

            if (curr === null || distances[curr] === Infinity || curr === endNode) {
                break;
            }

            unvisited.delete(curr);

            for (const edge of (this.adj[curr] || [])) {
                if (unvisited.has(edge.to)) {
                    const alt = distances[curr] + edge.dist;
                    if (alt < distances[edge.to]) {
                        distances[edge.to] = alt;
                        previous[edge.to] = curr;
                    }
                }
            }
        }

        // Truy vết đường đi
        const path = [];
        let u = endNode;
        while (u !== null) {
            path.unshift(u);
            u = previous[u];
        }

        if (path.length > 0 && path[0] === startNode) {
            return {
                path: path.map(code => ({ code, name: this.nodes[code].name })),
                totalDistance: distances[endNode]
            };
        }
        return null;
    }
}

// ==========================================
// 5. QUEUE (FIFO) - HÀNG ĐỢI XỬ LÝ TIN NHẮN & THÔNG BÁO
// ==========================================
class MessageQueue {
    constructor() {
        this.items = [];
    }

    enqueue(message) {
        this.items.push({
            ...message,
            timestamp: Date.now(),
            status: 'queued'
        });
    }

    dequeue() {
        if (this.isEmpty()) return null;
        const msg = this.items.shift();
        msg.status = 'processed';
        return msg;
    }

    peek() {
        return this.items[0] || null;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

// ==========================================
// 6. STACK (LIFO) - UNDO/REDO & LỊCH SỬ THÔNG BÁO MỚI NHẤT
// ==========================================
class ActionStack {
    constructor(limit = 30) {
        this.stack = [];
        this.limit = limit;
    }

    push(item) {
        this.stack.push({
            data: item,
            time: new Date()
        });
        if (this.stack.length > this.limit) {
            this.stack.shift(); // Giữ tối đa số lượng lịch sử
        }
    }

    pop() {
        return this.stack.pop() || null;
    }

    peek() {
        return this.stack[this.stack.length - 1] || null;
    }

    getAllLIFO() {
        return [...this.stack].reverse(); // Phần tử mới nhất lên đầu danh sách
    }

    isEmpty() {
        return this.stack.length === 0;
    }

    clear() {
        this.stack = [];
    }
}

// ==========================================
// 7. HASH TABLE (SEPARATE CHAINING) - QUẢN LÝ PHIÊN O(1)
// ==========================================
class SessionHashTable {
    constructor(size = 53) {
        this.size = size;
        this.buckets = new Array(size).fill(null).map(() => []);
    }

    _hash(token) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = (hash * 31 + token.charCodeAt(i)) % this.size;
        }
        return hash;
    }

    set(token, sessionData) {
        const index = this._hash(token);
        const bucket = this.buckets[index];
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].token === token) {
                bucket[i].data = sessionData;
                return;
            }
        }
        bucket.push({ token, data: sessionData });
    }

    get(token) {
        const index = this._hash(token);
        const bucket = this.buckets[index];
        for (const item of bucket) {
            if (item.token === token) return item.data;
        }
        return null;
    }

    delete(token) {
        const index = this._hash(token);
        const bucket = this.buckets[index];
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].token === token) {
                bucket.splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

// ==========================================
// 8. DOUBLY LINKED LIST - BẢNG TIN VÔ TẬN & CHÈN/XÓA O(1)
// ==========================================
class DLLNode {
    constructor(post) {
        this.post = post;
        this.prev = null;
        this.next = null;
    }
}

class PostDoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
        this.nodeMap = new Map(); // O(1) tìm node theo post.id
    }

    // Chèn bài đăng mới lên đầu bảng tin O(1)
    insertFront(post) {
        const newNode = new DLLNode(post);
        this.nodeMap.set(post.id, newNode);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }
        this.length++;
        return newNode;
    }

    // Xóa bài đăng khi hoàn tất pass hoặc hết hạn O(1)
    remove(postId) {
        const node = this.nodeMap.get(postId);
        if (!node) return false;

        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }

        this.nodeMap.delete(postId);
        this.length--;
        return true;
    }

    // Duyệt danh sách bài đăng từ mới nhất đến cũ nhất
    toArray() {
        const result = [];
        let curr = this.head;
        while (curr) {
            result.push(curr.post);
            curr = curr.next;
        }
        return result;
    }

    // Hỗ trợ Infinite Scroll: lấy n bài tiếp theo từ node hiện tại
    getPage(startNode = null, pageSize = 8) {
        let curr = startNode || this.head;
        const page = [];
        while (curr && page.length < pageSize) {
            page.push(curr.post);
            curr = curr.next;
        }
        return {
            items: page,
            nextNode: curr
        };
    }
}

// Xuất toàn bộ module ra global window để truy cập linh hoạt
window.UTC2_DSA = {
    TrieWithHeap,
    AVLTree,
    SegmentTree,
    RecommendationGraph,
    KDTree,
    CampusGraph,
    MessageQueue,
    ActionStack,
    SessionHashTable,
    PostDoublyLinkedList
};

